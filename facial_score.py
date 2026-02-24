"""
Facial feature capture and scoring for FitTrack.
Captures from webcam (or an image file), detects face with MediaPipe,
and outputs a 0-100 facial score based on detection quality and symmetry.
"""

import argparse
import sys
from typing import List, Optional, Tuple

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np


# MediaPipe Face Mesh landmark indices (left/right pairs for symmetry)
# See: https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
LEFT_RIGHT_PAIRS = [
    (93, 323),   # cheek
    (61, 291),   # lip
    (33, 263),   # eye inner
    (159, 386),  # eye outer
    (130, 359),  # brow
]
NOSE_TIP_IDX = 4


def compute_facial_score(landmarks, frame_width: int, frame_height: int) -> float:
    """
    Compute a 0-100 score from face landmarks.
    - Symmetry: left vs right landmark balance (higher = more symmetric).
    - Completeness: face size and visibility (larger, centered face scores higher).
    """
    if not landmarks or len(landmarks) == 0:
        return 0.0

    # First face's list of 468 landmark points (same structure as drawing code)
    lm = landmarks[0]
    h, w = frame_height, frame_width

    # Nose tip as face center
    nose = lm[NOSE_TIP_IDX]
    cx = nose.x * w
    cy = nose.y * h

    # Symmetry: for each left/right pair, ideal is (center - left_x) ≈ (right_x - center)
    symmetry_errors = []
    for left_idx, right_idx in LEFT_RIGHT_PAIRS:
        lx = lm[left_idx].x * w
        rx = lm[right_idx].x * w
        left_dist = abs(cx - lx)
        right_dist = abs(rx - cx)
        if left_dist + right_dist > 1e-6:
            # Balance: 0 = perfect, 1 = fully skewed
            imbalance = abs(left_dist - right_dist) / (left_dist + right_dist)
            symmetry_errors.append(imbalance)

    symmetry_score = 50.0
    if symmetry_errors:
        avg_error = np.mean(symmetry_errors)
        symmetry_score = 50.0 * (1.0 - min(1.0, avg_error * 2))

    # Completeness: face size (relative to frame) and roughly centered
    xs = [p.x * w for p in lm]
    ys = [p.y * h for p in lm]
    face_w = max(xs) - min(xs)
    face_h = max(ys) - min(ys)
    area_ratio = (face_w * face_h) / (w * h) if (w * h) > 0 else 0
    # Prefer face taking ~5-25% of frame
    size_score = 25.0 * min(1.0, max(0.0, (area_ratio - 0.02) / 0.20))
    # Centered: penalty if face center is far from image center
    img_cx, img_cy = w / 2, h / 2
    dist = np.hypot(cx - img_cx, cy - img_cy)
    max_dist = np.hypot(w, h) / 2
    center_score = 25.0 * (1.0 - min(1.0, dist / max_dist)) if max_dist > 0 else 25.0

    total = symmetry_score + size_score + center_score
    return round(min(100.0, max(0.0, total)), 1)


def run_on_frame(frame, detector) -> Tuple[float, Optional[List]]:
    """Run face mesh on one BGR frame. Returns (score, landmarks or None)."""
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    h, w = frame.shape[:2]
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = detector.detect(mp_img)
    landmarks = result.face_landmarks
    score = compute_facial_score(landmarks, w, h) if landmarks else 0.0
    return score, landmarks


def run_webcam(sample_frames: Optional[int] = None, camera_id: int = 0):
    """
    Capture from webcam and show live score.
    If sample_frames is set, exit after that many frames and print final score.
    """
    base_options = python.BaseOptions(model_asset_path="face_landmarker.task")
    options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=1)
    detector = vision.FaceLandmarker.create_from_options(options)

    cap = cv2.VideoCapture(camera_id)
    if not cap.isOpened():
        print("Error: Could not open webcam.", file=sys.stderr)
        sys.exit(1)

    frame_count = 0
    scores = []

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame_count += 1
            score, landmarks = run_on_frame(frame, detector)
            scores.append(score)

            # Draw score on frame
            cv2.putText(
                frame, f"Facial score: {score}", (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2
            )
            if landmarks:
                # Optional: draw a few key points
                for idx in [NOSE_TIP_IDX, 93, 323]:
                    p = landmarks[0][idx]
                    x, y = int(p.x * frame.shape[1]), int(p.y * frame.shape[0])
                    cv2.circle(frame, (x, y), 3, (0, 255, 0), -1)

            cv2.imshow("Facial score - press Q to quit", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
            if sample_frames is not None and frame_count >= sample_frames:
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()

    if scores:
        final = round(sum(scores) / len(scores), 1)
        print(f"Facial score (average over {len(scores)} frames): {final}")
        return final
    print("Facial score: 0 (no frames)", file=sys.stderr)
    return 0.0


def score_from_image_buffer(frame_bgr) -> float:
    """
    Run face landmarker on a BGR image (numpy array from cv2).
    Used by the web backend when it receives an uploaded/captured frame.
    """
    if frame_bgr is None or frame_bgr.size == 0:
        return 0.0
    base_options = python.BaseOptions(model_asset_path="face_landmarker.task")
    options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=1)
    detector = vision.FaceLandmarker.create_from_options(options)

    score, _ = run_on_frame(frame_bgr, detector)
    return score


def run_on_image(path: str) -> float:
    """Load an image, run face landmarker, print and return score."""
    base_options = python.BaseOptions(model_asset_path="face_landmarker.task")
    options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=1)
    detector = vision.FaceLandmarker.create_from_options(options)

    frame = cv2.imread(path)
    if frame is None:
        print(f"Error: Could not read image: {path}", file=sys.stderr)
        sys.exit(1)

    score, _ = run_on_frame(frame, detector)
    
    print(f"Facial score: {score}")
    return score


def main():
    parser = argparse.ArgumentParser(description="Capture facial features and output a 0-100 score.")
    parser.add_argument(
        "--image", "-i",
        type=str,
        help="Path to an image file. If not set, use webcam.",
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=0,
        help="Webcam device index (default: 0).",
    )
    parser.add_argument(
        "--frames",
        type=int,
        default=None,
        help="When using webcam, exit after this many frames and print average score.",
    )
    args = parser.parse_args()

    if args.image:
        run_on_image(args.image)
    else:
        run_webcam(sample_frames=args.frames, camera_id=args.camera)


if __name__ == "__main__":
    main()
