from pathlib import Path
from app.schemas.document import InterviewDocument
from app.services.processing.normalizer import normalize_text

class RoleKnowledgeLoader:
    """
    Loads curated role knowledge from:

    role_knowledge/
        ai_engineer/
        backend_engineer/
        ...
    """

    def __init__(self, root_dir: str = "role_knowledge"):
        path = Path(root_dir)
        if not path.is_absolute() and not path.exists():
            # Check relative to AIService root
            repo_root = Path(__file__).resolve().parents[3] / root_dir
            if repo_root.exists():
                path = repo_root
        self.root_dir = path

    @staticmethod
    def role_name_from_slug(slug: str) -> str:
        """
        Convert folder names into human-readable role names.
        """

        aliases = {
            "ai_engineer": "AI Engineer",
            "backend_engineer": "Backend Engineer",
            "frontend_engineer": "Frontend Engineer",
            "fullstack_engineer": "Fullstack Engineer",
            "devops_engineer": "DevOps Engineer",
            "data_scientist": "Data Scientist",
            "cloud_engineer": "Cloud Engineer",
            "qa_engineer": "QA Engineer",
            "data_engineer": "Data Engineer",
            "ml_engineer": "ML Engineer",
            "software_engineer": "Software Engineer",
        }

        return aliases.get(
            slug,
            " ".join(part.capitalize() for part in slug.split("_")),
        )

    def load(self) -> list[InterviewDocument]:
        """
        Load all Markdown knowledge files.
        """

        if not self.root_dir.exists():
            raise FileNotFoundError(
                f"Role knowledge directory not found: {self.root_dir}"
            )

        documents: list[InterviewDocument] = []

        for role_dir in sorted(self.root_dir.iterdir()):

            # Ignore files; only process role directories
            if not role_dir.is_dir():
                continue

            role = self.role_name_from_slug(role_dir.name)

            for path in sorted(role_dir.glob("*.md")):

                content = normalize_text(
                    path.read_text(encoding="utf-8")
                )

                # Ignore empty files
                if not content:
                    continue

                document = InterviewDocument(
                    content=content,
                    source=str(path),
                    document_type="role",
                    section=path.stem,
                    metadata={
                        "scope": "global",
                        "role": role,
                        "role_slug": role_dir.name,
                    },
                )

                documents.append(document)

        return documents