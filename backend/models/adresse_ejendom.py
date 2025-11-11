"""
SQLAlchemy model for tblAdresseEjendom table.
Read-only access to property address and remarks data.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class AdresseEjendom(Base):
    """
    Model for tblAdresseEjendom table containing property address information
    and facility remarks (anlægs info).

    This is a READ-ONLY model - no writes or migrations should be performed.
    """
    __tablename__ = "tblAdresseEjendom"
    __table_args__ = {"schema": "dbo"}

    # Primary key
    Ejendomsnummer = Column(Integer, primary_key=True)

    # Core fields needed for Anlægs Info feature
    Adresse = Column(String(50), nullable=True, index=True)  # Used for matching with Åben land cases
    BEMARKNING_Rens = Column(String(1000), nullable=True)  # Facility remarks to display

    # Additional useful fields (optional, for context)
    GeoIDDelopland = Column(Integer, nullable=True)
    GeoIDSimOpland = Column(Integer, nullable=True)
    Vejkode = Column(Integer, nullable=True)
    TypeID = Column(Integer, nullable=True)
    Beskrivelse = Column(String(200), nullable=True)
    AntalAdresser = Column(Integer, nullable=True)
    AntalBolig = Column(Integer, nullable=True)
    AntalErhverv = Column(Integer, nullable=True)
    ANLAGSNR = Column(String(15), nullable=True)

    def __repr__(self):
        return f"<AdresseEjendom(Ejendomsnummer={self.Ejendomsnummer}, Adresse='{self.Adresse}')>"

    def get_bemaerkning_or_default(self, default: str = "ingen bemærkninger") -> str:
        """
        Get BEMARKNING_Rens value or return default text if empty/null.

        Args:
            default: Default text to return if no remark exists

        Returns:
            Remark text or default text
        """
        if self.BEMARKNING_Rens and self.BEMARKNING_Rens.strip():
            return self.BEMARKNING_Rens.strip()
        return default
