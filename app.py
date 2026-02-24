"""
FitTrack backend: serves the website and runs the facial scoring API.
Run with: python app.py  (then open http://localhost:5000)
"""

import io
import os

import cv2
import numpy as np
from flask import Flask, request, jsonify, send_from_directory

# Import facial scoring from the standalone script
from facial_score import score_from_image_buffer

app = Flask(__name__, static_folder=".", static_url_path="")

# Serve index.html at /
@app.route("/")
def index():
    return send_from_directory(".", "index.html")


# Serve other static files (CSS, JS, assets)
@app.route("/<path:path>")
def static_file(path):
    return send_from_directory(".", path)


@app.route("/api/facial-score", methods=["POST"])
def api_facial_score():
    """
    Accept an image (multipart form "image" or raw body as image bytes).
    Return { "score": number }.
    """
    frame = None
    if request.files and "image" in request.files:
        file = request.files["image"]
        if file.filename:
            data = file.read()
            arr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    elif request.data:
        arr = np.frombuffer(request.data, np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({"error": "No image provided"}), 400

    try:
        score = score_from_image_buffer(frame)
        return jsonify({"score": round(score, 1)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
