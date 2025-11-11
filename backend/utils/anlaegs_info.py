"""
Utility functions for fetching facility information (Anlægs Info) from tblAdresseEjendom.

This module provides read-only access to facility remarks associated with addresses.
"""
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.adresse_ejendom import AdresseEjendom


def get_anlaegs_info_by_adresse(
    db: Session,
    adresse: str,
    default_text: str = "ingen bemærkninger"
) -> str:
    """
    Fetch facility remarks (BEMARKNING_Rens) for a given address.

    This function queries the tblAdresseEjendom table to find remarks associated
    with a specific address. Used to display facility information in Åben land cases.

    Args:
        db: SQLAlchemy database session
        adresse: Address string to search for (case-insensitive)
        default_text: Text to return if no remark is found or remark is empty

    Returns:
        Facility remark text or default text if none exists

    Example:
        >>> db = SessionLocal()
        >>> info = get_anlaegs_info_by_adresse(db, "Buggsgaardvej 9")
        >>> print(info)
        "2,3 m3 trekammer bf. 45 m2 høvet tryknedsivningsanlæg"
    """
    if not adresse or not adresse.strip():
        return default_text

    try:
        # Query for matching address (case-insensitive)
        # Using func.lower for case-insensitive comparison
        ejendom = (
            db.query(AdresseEjendom)
            .filter(func.lower(AdresseEjendom.Adresse) == func.lower(adresse.strip()))
            .first()
        )

        if ejendom:
            return ejendom.get_bemaerkning_or_default(default_text)

        return default_text

    except Exception as e:
        # Log error but don't crash - return default text
        print(f"Error fetching anlægs info for address '{adresse}': {e}")
        return default_text


def get_anlaegs_info_by_ejendomsnummer(
    db: Session,
    ejendomsnummer: int,
    default_text: str = "ingen bemærkninger"
) -> str:
    """
    Fetch facility remarks (BEMARKNING_Rens) by property number.

    Alternative lookup method using the property number instead of address.

    Args:
        db: SQLAlchemy database session
        ejendomsnummer: Property number (Ejendomsnummer)
        default_text: Text to return if no remark is found

    Returns:
        Facility remark text or default text if none exists
    """
    try:
        ejendom = (
            db.query(AdresseEjendom)
            .filter(AdresseEjendom.Ejendomsnummer == ejendomsnummer)
            .first()
        )

        if ejendom:
            return ejendom.get_bemaerkning_or_default(default_text)

        return default_text

    except Exception as e:
        print(f"Error fetching anlægs info for property {ejendomsnummer}: {e}")
        return default_text


def get_adresse_ejendom_details(
    db: Session,
    adresse: str
) -> Optional[AdresseEjendom]:
    """
    Fetch complete AdresseEjendom record for a given address.

    Returns the full model object with all fields, not just the remark.
    Useful if additional property information is needed.

    Args:
        db: SQLAlchemy database session
        adresse: Address string to search for

    Returns:
        AdresseEjendom object or None if not found
    """
    if not adresse or not adresse.strip():
        return None

    try:
        return (
            db.query(AdresseEjendom)
            .filter(func.lower(AdresseEjendom.Adresse) == func.lower(adresse.strip()))
            .first()
        )
    except Exception as e:
        print(f"Error fetching property details for address '{adresse}': {e}")
        return None
