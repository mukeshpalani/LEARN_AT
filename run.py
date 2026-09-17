import os
import sys
import time
import signal
import subprocess
import webbrowser
from pathlib import Path

# Ensure root directory is in sys.path
ROOT_DIR = Path(__file__).parent.resolve()
sys.path.insert(0, str(ROOT_DIR))

# Ensure documents and reports directories exist
os.makedirs(ROOT_DIR / "documents", exist_ok=True)
os.makedirs(ROOT_DIR / "generated_reports", exist_ok=True)

processes = []


def cleanup(sig=None, frame=None):
    print("\nShutting down KnowledgePilot services...")
    for p in processes:
        if p.poll() is None:
            try:
                p.terminate()
            except Exception:
                pass
    sys.exit(0)


signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)


def main():
    print("=" * 60)
    print("🚀 Starting KnowledgePilot Application (Backend + Frontend)")
    print("=" * 60)

    # 1. Start Backend Uvicorn Process
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
    print("Starting Backend API Engine on http://127.0.0.1:8000...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(ROOT_DIR),
        env={**os.environ, "PYTHONPATH": str(ROOT_DIR), "PYTHONIOENCODING": "utf-8"}
    )
    processes.append(backend_proc)

    # 2. Start Frontend Vite Process
    frontend_dir = ROOT_DIR / "frontend"
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    print("Starting Frontend React UI on http://localhost:5173...")
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(frontend_dir)
    )
    processes.append(frontend_proc)

    # 3. Wait for services to initialize
    print("Waiting for services to spin up...")
    time.sleep(3)

    # 4. Open browser automatically
    print("\nOpening KnowledgePilot in your default browser: http://localhost:5173")
    try:
        webbrowser.open("http://localhost:5173")
    except Exception as e:
        print(f"Could not open browser automatically: {e}")

    print("\n✅ KnowledgePilot is online!")
    print("Press Ctrl+C at any time to stop all services.\n")

    # Keep main process alive
    try:
        while True:
            time.sleep(1)
            # Check if any process died unexpectedly
            if backend_proc.poll() is not None:
                print("❌ Backend process terminated unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("❌ Frontend process terminated unexpectedly.")
                break
    except KeyboardInterrupt:
        cleanup()


if __name__ == "__main__":
    main()
