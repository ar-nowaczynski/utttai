import os
import pathlib
import re

DIST_INDEX_HTML_PATH = pathlib.Path("dist/index.html")
DIST_404_HTML_PATH = pathlib.Path("dist/404.html")
FAVICON_HTML_PATH = pathlib.Path("logo/favicon/html_code.html")


def set_current_directory() -> None:
    os.chdir(pathlib.Path(__file__).resolve().parent)


def insert_head_tags(index_html: str, head_tags: str) -> str:
    i = index_html.find("</head>")
    if i == -1:
        raise RuntimeError("cannot find </head>")
    index_html = index_html[:i] + head_tags + index_html[i:]
    return index_html


def insert_favicon_tags() -> None:
    with open(DIST_INDEX_HTML_PATH) as f:
        index_html = f.read()
    with open(FAVICON_HTML_PATH) as f:
        favicon_html = f.read()
    favicon_html = favicon_html.replace("\n", "")
    index_html = insert_head_tags(index_html, favicon_html)
    print(index_html)
    with open(DIST_INDEX_HTML_PATH, "w") as f:
        f.write(index_html)
    print(f"{DIST_INDEX_HTML_PATH} saved successfully!")
    return index_html


def minify_404_html() -> str:
    with open(DIST_404_HTML_PATH) as f:
        html404 = f.read()
    # remove whitespace characters after '>':
    html404 = re.sub("(?<=>)(\s+)", "", html404)
    # remove whitespace characters before "/>":
    html404 = re.sub("(\s+)(?=\/>)", "", html404)
    print(html404)
    with open(DIST_404_HTML_PATH, "w") as f:
        f.write(html404)
    print(f"{DIST_404_HTML_PATH} minified successfully!")
    return html404


def main() -> None:
    print("postprocessing...")
    set_current_directory()
    insert_favicon_tags()
    minify_404_html()


if __name__ == "__main__":
    main()
