import os
import pathlib
import subprocess
import time

from watchdog.events import PatternMatchingEventHandler
from watchdog.observers import Observer


def set_current_directory() -> None:
    os.chdir(pathlib.Path(__file__).resolve().parent)


def lessc() -> None:
    subprocess.call(args=["lessc", "src/styles.less", "src/styles.css"])


class LesscEventHandler(PatternMatchingEventHandler):
    def on_modified(self, event) -> None:
        print(f"{event.event_type} path: {event.src_path}")
        lessc()

    def on_created(self, event) -> None:
        print(f"{event.event_type} path: {event.src_path}")
        lessc()

    def on_deleted(self, event) -> None:
        print(f"{event.event_type} path: {event.src_path}")
        lessc()


def main() -> None:
    print("lessc...")
    set_current_directory()
    lessc()
    lessc_event_handler = LesscEventHandler(patterns=["*less"])
    observer = Observer()
    observer.schedule(lessc_event_handler, path="src", recursive=True)
    observer.start()
    try:
        time.sleep(60)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
