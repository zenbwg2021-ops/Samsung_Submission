# How to open the FitTrack prototype

## Option 1 — Quick (no backend)

1. Open File Explorer and go to:  
   **`c:\Users\zenul\OneDrive\Desktop\Samsung_1`**
2. **Double‑click `index.html`**.  
   It will open in your browser.
3. You can fill your profile and generate a workout plan.  
   **Facial score** will only work if you use Option 2.

---

## Option 2 — Full (with facial scan)

1. **Open a terminal** in the project folder:
   - In Cursor: press **Ctrl+`** (backtick).
   - Or: Win + R → type `cmd` → Enter, then type:
     ```text
     cd "c:\Users\zenul\OneDrive\Desktop\Samsung_1"
     ```

2. **Install packages** (first time only):
   ```text
   pip install -r requirements.txt
   ```
   If that says "python was not found", try:
   ```text
   py -m pip install -r requirements.txt
   ```

3. **Start the server**:
   ```text
   python app.py
   ```
   Or if `python` doesn’t work:
   ```text
   py app.py
   ```

4. **Open your browser** and go to:  
   **http://localhost:5000**

5. Keep the terminal window open while you use the site.

---

## If it still doesn’t work

- **“Python was not found”**  
  Install Python from https://www.python.org/downloads/ and tick **“Add python.exe to PATH”**, then close and reopen the terminal and try again.

- **“Cannot GET /” or blank page**  
  Make sure you went to **http://localhost:5000** (with no typo) and that the terminal is still running `python app.py`.

- **Facial score says “failed”**  
  Use Option 2 and open **http://localhost:5000** (don’t open `index.html` by double‑click for the facial scan).

- **Camera doesn’t start**  
  Allow camera access when the browser asks, and check that no other app is using the webcam.
