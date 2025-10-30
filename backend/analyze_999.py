"""
Analyse af hvorfor Åben Land påbud viser 999
"""

print("=== ANALYSE AF TALLET 999 ===\n")

print("BRUGER DATA:")
print("- Total Åben Land sager: 1781")
print("- Aktive Åben Land påbud: 71")
print("- Dashboard viser total påbud: 999")
print()

print("ANALYSE:")
print("1. 999 er IKKE det totale antal sager (1781)")
print("2. 999 er et systematisk tal - måske et cap eller default værdi")
print("3. 999 kan være et paginerings resultat")
print("4. 999 kan være en fejl i API'en")
print()

print("MULIGE FORKLARINGER PÅ 999:")
print("A) API'en har et 'limit=1000' og returnerer '999' som 'mange'")
print("B) Der er en fejl i databasen der returnerer 999")
print("C) Frontend'en viser forkert felt")
print("D) Der er en cap/limit et sted i systemet")
print()

print("SPØRGSMÅL:")
print("1. Kommer 999 fra frontend eller backend?")
print("2. Hvad viser Sagsbehandling for 'Har påbud' = 'Ja' UDEN projekttype filter?")
print("3. Er der andre steder i systemet hvor du ser tallet 999?")
print()

print("TEST FORSLAG:")
print("1. Tjek browser network fanen når du loader Åben Land dashboard")
print("2. Se hvad API'en faktisk returnerer i JSON responsen")
print("3. Sammenlign med andre projekttyper's påbud tal")

print("\nFORVENTET RESULTAT:")
print("Total påbud for Åben Land burde være: 71 (aktive) + X (afsluttede)")
print("Hvis der er f.eks. 100 afsluttede påbud, burde total være ~171")
print("999 er næsten helt sikkert en fejl")