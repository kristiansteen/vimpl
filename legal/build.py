"""Build frontend/privacy.html and frontend/dpa.html from legal/*.md.

Single source for the privacy notice and the DPA used by both vimpl and Ailean.
Run: python3 legal/build.py
"""
import pathlib, re, markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
FRONT = ROOT / "frontend"
PAGES = {
    "privacy": ("Privacy Notice", "Privacy", "Notice", "How vimpl.com A/S handles personal data on vimpl and Ailean."),
    "dpa": ("Data Processing Agreement", "Data Processing", "Agreement", "The DPA covering vimpl and Ailean."),
}

HEAD = """<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - vimpl</title>
    <meta name="description" content="{desc}">
    <link rel="icon" type="image/svg+xml"
        href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%2365c434' rx='20' width='100' height='100'/><text x='50' y='68' font-size='50' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'>v</text></svg>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/index.css">
    <link href="assets/css/fonts.css" rel="stylesheet">
    <link href="assets/css/legal.css" rel="stylesheet">
    <script src="assets/js/consent.js" defer></script>
</head>

<body>
    <!-- Generated from legal/{name}.md by legal/build.py. Edit the markdown, not this file. -->
    <a href="https://www.ailean.dk" class="powered-by-badge" target="_blank">
        <span>Powered by</span>
        <span class="lean-logo">AILEAN</span>
    </a>
    <nav class="nav">
        <div class="nav-container">
            <a href="/" class="logo">vimpl<span>.com</span></a>
            <div class="nav-links">
                <a href="index.html#features" class="nav-link">Features</a>
                <a href="pricing.html" class="nav-link">Pricing</a>
                <a href="about.html" class="nav-link">About</a>
            </div>
            <div class="nav-auth">
                <a href="login.html" class="nav-link">Log in</a>
                <a href="register.html" class="btn-primary-small">Sign up</a>
            </div>
        </div>
    </nav>

    <section class="hero" style="min-height: 260px; padding-top: 120px; padding-bottom: 32px;">
        <div class="hero-container" style="flex-direction: column; text-align: center; gap: 16px;">
            <h1 style="max-width: 800px; margin: 0 auto;">{h1a} <span style="color: var(--primary);">{h1b}</span></h1>
            <p style="max-width: 640px; margin: 0 auto; color: var(--gray-600); font-size: 1.15rem;">vimpl and Ailean</p>
        </div>
    </section>

    <section class="features" style="background: white; padding-top: 32px;">
        <div class="features-container">
            <article class="legal">
{body}
            </article>
        </div>
    </section>
"""

FOOT = """
    <footer class="footer">
        <div class="footer-container">
            <div class="footer-logo">vimpl<span>.com</span></div>
            <div class="footer-links">
                <a href="privacy.html" class="footer-link">Privacy</a>
                <a href="dpa.html" class="footer-link">DPA</a>
                <a href="terms.html" class="footer-link">Terms</a>
                <a href="https://github.com/kristiansteen/vimpl" class="footer-link" target="_blank">
                    <i class="fab fa-github"></i> GitHub
                </a>
            </div>
            <div class="footer-copy">© 2026 vimpl.com A/S. All rights reserved.</div>
        </div>
    </footer>
</body>

</html>
"""

def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")

for name, (title, h1a, h1b, desc) in PAGES.items():
    md = (ROOT / "legal" / f"{name}.md").read_text()
    html = markdown.markdown(md, extensions=["tables"])
    html = re.sub(r"<h2>(.*?)</h2>", lambda m: f'<h2 id="{slug(re.sub("<.*?>", "", m.group(1)))}">{m.group(1)}</h2>', html)
    html = html.replace("<table>", '<div class="legal-table"><table>').replace("</table>", "</table></div>")
    out = HEAD.format(title=title, desc=desc, name=name, h1a=h1a, h1b=h1b, body=html) + FOOT
    (FRONT / f"{name}.html").write_text(out)
    print("wrote", f"frontend/{name}.html")
