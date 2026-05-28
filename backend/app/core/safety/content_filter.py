import re


class ContentFilter:
    """Filters harmful or inappropriate content from input/output text."""

    # Patterns for PII that should not be shared
    PII_PATTERNS = [
        (r"\b1[3-9]\d{9}\b", "[手机号已隐藏]"),  # Chinese mobile
        (r"\b\d{6}\d{4}\d{2}\d{2}\d{2}[0-9Xx]\b", "[身份证号已隐藏]"),  # Chinese ID
        (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "[邮箱已隐藏]"),
    ]

    # Hate speech / profanity patterns (basic — expand as needed)
    HATE_PATTERNS = [
        r"(nmsl|cnm|sb|傻逼|操你|草你|fuck|shit)",
    ]

    def __init__(self):
        self.pii_re = [(re.compile(p, re.IGNORECASE), r) for p, r in self.PII_PATTERNS]
        self.hate_re = [re.compile(p, re.IGNORECASE) for p in self.HATE_PATTERNS]

    def filter_pii(self, text: str) -> str:
        """Replace PII with placeholders."""
        for pattern, replacement in self.pii_re:
            text = pattern.sub(replacement, text)
        return text

    def detect_hate_speech(self, text: str) -> bool:
        """Return True if hate speech patterns detected."""
        return any(pattern.search(text) for pattern in self.hate_re)

    async def filter_input(self, text: str) -> dict:
        """Filter and sanitize user input. Returns sanitized text + flags."""
        flags = []
        sanitized = self.filter_pii(text)

        if sanitized != text:
            flags.append("pii_removed")

        if self.detect_hate_speech(text):
            flags.append("hate_speech_detected")

        return {"sanitized_text": sanitized, "flags": flags}

    async def filter_output(self, text: str) -> dict:
        """Screen AI output for problematic content."""
        pii_sanitized = self.filter_pii(text)

        return {
            "sanitized_text": pii_sanitized,
            "pii_removed": pii_sanitized != text,
        }
