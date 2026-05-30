# TENLE

A daily number puzzle inspired by the British train-carriage game: combine the five given numbers (in order) with arithmetic operators and brackets to make **10**.

🔗 **Play:** https://aidanm3341.github.io/tenle/

- Drag operators (`+ − × ÷ ^`) into the slots between the numbers
- Drag brackets `( )` onto the numbers to control order of operations
- Tap a placed operator or bracket to remove it
- A new puzzle every day; view a past puzzle at `/tenle/{number}`

## Development

```bash
npm install
npm run dev        # local dev server (served under /tenle/)
npm run build      # production build to dist/
npm run preview    # preview the production build
npm run generate   # regenerate the puzzle set (scripts/generatePuzzles.cjs)
```

Built with React + Vite + TypeScript, fully client-side. Deployed automatically to GitHub Pages on every push to `main` via GitHub Actions.
