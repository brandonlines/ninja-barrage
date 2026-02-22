# Ninja Barrage

Ninja Barrage is a static browser game designed for desktop and mobile.

## Gameplay Rules

- You are a ninja defending your home in a grass field.
- The game has **5 waves**.
- Each wave has **30 low-level enemies**.
- You have **3 hearts**.
- Enemy contact deals **10% heart damage** per hit (0.1 heart).
- You get **30 shuriken per wave**.
- Shuriken deal full enemy damage (instant defeat for low-level enemies).

## Controls

### Desktop

- Move: `WASD` or Arrow Keys
- Sword attack: `Space`
- Throw shuriken: `F` or click/tap direction on the game area

### Mobile

- Move: on-screen D-pad
- Sword: on-screen `Sword` button
- Throw shuriken: on-screen `Shuriken` button or tap direction on canvas

## Local Run

Open `index.html` in a browser.

## Host on GitHub Pages

1. Create a GitHub repository (for example: `ninja-barrage`).
2. Push these files to the repository root:
   - `index.html`
   - `styles.css`
   - `game.js`
   - `README.md`
3. In GitHub repo settings, go to **Pages**.
4. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main` (root)
5. Save, then wait for deployment.
6. Your game will be available at:
   - `https://<your-username>.github.io/<repo-name>/`
