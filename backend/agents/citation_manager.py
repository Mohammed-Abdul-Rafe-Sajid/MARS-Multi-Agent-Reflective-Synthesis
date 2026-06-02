"""
Citation Manager — Section 3.8
Maps paper IDs to APA/BibTeX citations.
Validates all citations against retrieved paper metadata.
"""

from utils.schemas import PaperObject


def to_apa(paper: PaperObject) -> str:
    authors = ", ".join(paper.authors[:3])
    if len(paper.authors) > 3:
        authors += " et al."
    doi_part = f" https://doi.org/{paper.doi}" if paper.doi else ""
    arxiv_part = f" {paper.arxiv_link}" if paper.arxiv_link else ""
    return f"{authors} ({paper.year}). {paper.title}.{doi_part}{arxiv_part}"


def to_bibtex(paper: PaperObject) -> str:
    key = f"{paper.authors[0].split()[-1].lower() if paper.authors else 'unknown'}{paper.year}"
    author_field = " and ".join(paper.authors[:5])
    doi_line = f"  doi = {{{paper.doi}}},\n" if paper.doi else ""
    url_line = f"  url = {{{paper.arxiv_link or paper.url}}},\n"
    return (
        f"@article{{{key},\n"
        f"  title = {{{paper.title}}},\n"
        f"  author = {{{author_field}}},\n"
        f"  year = {{{paper.year}}},\n"
        f"{doi_line}"
        f"{url_line}"
        f"}}"
    )


def export_bibtex(papers: list[PaperObject]) -> str:
    """Full BibTeX block for all session references."""
    entries = [to_bibtex(p) for p in papers]
    return "\n\n".join(entries)


def validate_citations(papers: list[PaperObject], cited_ids: list[str]) -> dict[str, bool]:
    """
    Validate that all cited paper IDs exist in the retrieved paper set.
    Returns {paper_id: valid}.
    """
    known = {p.id for p in papers}
    return {pid: pid in known for pid in cited_ids}


def build_reference_list(papers: list[PaperObject]) -> list[dict]:
    """Structured reference list with clickable links."""
    refs = []
    for p in papers:
        refs.append({
            "paper_id":  p.id,
            "apa":       to_apa(p),
            "doi_url":   f"https://doi.org/{p.doi}" if p.doi else None,
            "arxiv_url": p.arxiv_link,
            "year":      p.year,
            "title":     p.title,
            "authors":   p.authors,
        })
    return refs
