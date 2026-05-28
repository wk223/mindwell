"""Scrape psychological test questions from shiyan.weixin-wh.com using Scrapling."""
from scrapling import Fetcher

TARGET = "http://shiyan.weixin-wh.com/"


def main():
    fetcher = Fetcher()
    fetcher.headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/148.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
    }

    print(f"Fetching {TARGET} ...")
    page = fetcher.get(TARGET, verify=False)

    print(f"Status: {page.status}")
    print(f"Title: {page.css('title')[0].text if page.css('title') else 'N/A'}")
    print(f"\nBody:\n{page.body[:1500]}")

    links = page.css("a")
    print(f"\n=== {len(links)} links ===")
    for i, link in enumerate(links):
        href = link.attrib.get("href", "")
        text = link.text_content().strip() if hasattr(link, 'text_content') else str(link)
        if text and len(text) < 100:
            print(f"  [{i}] {text} -> {href}")

    fetcher.close()


if __name__ == "__main__":
    main()
