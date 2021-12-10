import pathlib

from fastapi import FastAPI
from fastapi.responses import FileResponse
from starlette.staticfiles import StaticFiles

WEBSITE_DIRPATH = pathlib.Path(__file__).resolve().parent
DIST_DIRPATH = WEBSITE_DIRPATH / "dist"

app = FastAPI()


@app.get("/")
@app.get("/init")
@app.get("/rules")
@app.get("/blog")
@app.get("/about")
def root():
    return FileResponse(DIST_DIRPATH / "index.html")


app.mount("/", StaticFiles(directory=DIST_DIRPATH), name="dist")
