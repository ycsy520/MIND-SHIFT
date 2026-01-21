# MIND/SHIFT - Cognitive Reflex Engine

A browser-based reflex game controlled by head movements, featuring a sci-fi "Cognitive Reflex Engine" theme.

![MIND/SHIFT Banner](https://img.shields.io/badge/Status-Active-cyan)

## 🎮 How to Play

1.  **Allow Camera Access**: The game requires a webcam to track your head position.
2.  **Move Head**:
    *   **Blue Reality (Normal)**: Tilt head **Left** to move Left, **Right** to move Right.
    *   **Red Reality (Inverted)**: Controls are reversed! Tilt **Left** to move **Right**.
3.  **Dodge Walls**: Guide your ship through the gaps in the approaching digital walls.
4.  **Lives**: You have 3 lives. Colliding with a wall depletes a life.
5.  **Adapt**: As your score increases, the reality mode will switch between Normal and Inverted.

## 🛠️ Technology Stack

*   **React 18**: UI Framework
*   **TypeScript**: Type safety
*   **MediaPipe Tasks Vision**: Real-time face landmark detection
*   **Tailwind CSS**: Styling
*   **Vite**: Build tool

## 🚀 Getting Started

### Prerequisites

*   Node.js (v16 or higher)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/mind-shift.git
    cd mind-shift
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

## ☁️ Deployment

### Vercel (Recommended)

This project is configured for one-click deployment on Vercel.

1.  Push this code to your GitHub repository.
2.  Log in to [Vercel](https://vercel.com).
3.  Click "Add New..." -> "Project".
4.  Import your GitHub repository.
5.  Framework Preset should automatically detect as **Vite**.
6.  Click **Deploy**.

The `package.json` includes the necessary `build` script (`tsc && vite build`) which Vercel looks for.

## 📱 Mobile Compatibility

The game is optimized for mobile devices:
*   Prevents pinch-to-zoom.
*   Handles safe areas (notch support).
*   Larger touch targets and player visibility.
*   Graceful camera error handling.

## 📄 License

MIT
