# FitTrack — Fitness website prototype

A blue and light gray themed fitness site: enter your profile, run an AI facial scan, and get a personalized workout plan (park or calisthenics).

## Run the full site (with facial scan)

1. **Install dependencies** (first time):
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the backend** (serves the site and the facial-score API):
   ```bash
   python app.py
   ```

3. **Open in browser:**  
   [http://localhost:5000](http://localhost:5000)

4. On the site: fill **Your profile**, then in **AI health scan** click **Start scan** → allow camera → click **Get facial score**. The score appears in **Estimated health data** and is used when you click **Generate my plan**.

## Run without backend (frontend only)

Open `index.html` in your browser. Profile and plan generation work; the **Get facial score** button will fail until the backend is running.

## Run the facial scorer standalone

```bash
python facial_score.py              # webcam, press Q to quit
python facial_score.py --frames 30  # 30 frames then print average score
python facial_score.py --image path/to/photo.jpg
```
