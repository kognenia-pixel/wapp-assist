# -*- coding: utf-8 -*-
"""Construit Wapp_Assist_Cibles.xlsx — pack d'intelligence commerciale Wapp Assist."""
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Wapp_Assist_Cibles.xlsx")

GREEN = "10B27E"; DARK = "0B0B0B"; LIGHT = "F0FDF4"; GREY = "F2F2F2"
WHITE_F = PatternFill("solid", fgColor="FFFFFF")
GREEN_F = PatternFill("solid", fgColor=GREEN)
DARK_F = PatternFill("solid", fgColor=DARK)
LIGHT_F = PatternFill("solid", fgColor=LIGHT)
GREY_F = PatternFill("solid", fgColor=GREY)
TITLE_F = Font(name="Calibri", size=13, bold=True, color="FFFFFF")
HEAD_F = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
BODY_F = Font(name="Calibri", size=10)
SMALL_F = Font(name="Calibri", size=9, italic=True, color="555555")
LINK_F = Font(name="Calibri", size=10, color="0D9A6B", underline="single")
thin = Side(style="thin", color="D9D9D9")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical="top")
CENTER = Alignment(horizontal="center", vertical="top", wrap_text=True)

def style_header(ws, ncols, title, subtitle):
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=ncols)
    c = ws.cell(1, 1, title); c.font = TITLE_F; c.fill = DARK_F; c.alignment = Alignment(vertical="center")
    ws.row_dimensions[1].height = 28
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=ncols)
    c = ws.cell(2, 1, subtitle); c.font = SMALL_F; c.alignment = Alignment(vertical="center", wrap_text=True)
    ws.row_dimensions[2].height = 30
    for col in range(1, ncols + 1):
        ws.cell(3, col).font = HEAD_F; ws.cell(3, col).fill = GREEN_F
        ws.cell(3, col).alignment = CENTER; ws.cell(3, col).border = BORDER
    ws.row_dimensions[3].height = 32
    ws.freeze_panes = "A4"
    ws.auto_filter.ref = f"A3:{get_column_letter(ncols)}{3}"

wb = Workbook()

# ================= FEUILLE 1 : TOP SEGMENTS =================
# (secteur, region, douleur, signal, capacite, prix, ou_trouver, canal, angle, C1..C5)
SEG = [
("Agences immobilieres","Guinee — Conakry","Demandes de visite/dispo/prix le soir et WE sans reponse ; annonces avec numero WA sature","Annonces Jiji/Afrimalin avec bouton WhatsApp ; groupes FB immo Conakry tres actifs","Moyen",150,"Jiji, Afrimalin, groupes FB immo, Google Maps","Message FB + appel (numero affiche publiquement)","« Chaque demande recoit prix + dispo + photos, meme a 23h »",18,19,14,20,18),
("Restaurants / snacks / fast-food","Guinee — Conakry","Commandes du soir perdues ; menu et prix repetes 50x/jour sur WhatsApp","3,3M d'utilisateurs WhatsApp en Guinee ; Click-to-WhatsApp partout sur FB/IG","Moyen",115,"Groupes FB food Conakry, Google Maps, terrain Kaloum/Ratoma","Visite + demo live sur place","« Vos commandes du soir repondues en 10 secondes »",18,19,12,20,19),
("Boutiques mode / vetements","Guinee — Conakry","Catalogue envoye a la main, tailles/dispo demandees en boucle, clientes perdues la nuit","Vente IG/FB massive avec « ecrivez-nous sur WhatsApp » ; statuts WA catalogues","Moyen",115,"Instagram Conakry, groupes FB friperie/boutiques, Marche Madina","DM Instagram + visite","« Votre catalogue qui repond tout seul, jour et nuit »",18,18,12,20,19),
("Pharmacies / parapharmacies","Guinee — Conakry","Gardes, dispo medicaments, photos d'ordonnances sans reponse rapide","Numeros WA sur devantures et ordonnances ; usage WA Business repandu","Moyen",130,"Google Maps, visite terrain (Kaloum, Matoto)","Visite comptoir","« Dispo, garde et prix repondus instantanement »",18,17,13,20,18),
("Salons de beaute / spa / coiffure","Guinee — Conakry","Prises de RDV par message, no-shows, tarifs demandes en boucle","Salons avec bouton WA sur IG/FB ; RDV 100% par message","Moyen",115,"Instagram Conakry, Google Maps, groupes FB beaute","DM Instagram","« Fini les RDV manques : confirmation + rappel auto »",18,17,12,20,18),
("Electronique / telephonie","Guinee — Conakry","Comparatifs prix/specs interminables, SAV par message, promos a relayer","Boutiques Madina avec WA ; catalogues PDF circulant sur WhatsApp","Moyen",130,"Marche Madina, groupes FB high-tech Guinee","Visite + demo","« Fiche produit + prix + garantie, reponse immediate »",17,17,13,20,18),
("Restaurants / maquis","Cote d'Ivoire — Abidjan","Commandes midi/soir, menus du jour, livraison (Yango/Jumia Food en parallele)","10-11M utilisateurs WA ; Jumia CI actif ; culture commande par message","Moyen",149,"Jumia CI (vendeurs), Google Maps Plateau/Cocody, groupes FB food","Visite + appel","« Midi et soir : aucune commande perdue »",18,19,13,14,17),
("Immobilier (agences / demarcheurs)","Cote d'Ivoire — Abidjan","Visites, loyers, charges, dispo : 80% des echanges sur WhatsApp","Jiji.ci + groupes FB immo Abidjan enormes ; annonces avec WA direct","Moyen",169,"Jiji.co.ci, groupes FB immo, Google Maps","Message FB (numero public) + appel","« Qualification auto : budget, zone, visite calee »",18,19,14,14,17),
("Boutiques mode / friperie premium","Cote d'Ivoire — Abidjan","Drops, tailles, livraisons interurbaines (Bouake, Yamoussoukro)","Live TikTok/IG + « commandez sur WhatsApp » ; e-commerce mobile >50%","Moyen",149,"Instagram Abidjan, TikTok CI, Jumia CI","DM Instagram/TikTok","« Votre vendeuse 24h/24 qui ne dort jamais »",18,18,13,14,17),
("Cosmetiques / skincare","Cote d'Ivoire — Abidjan","Conseils routine, teintes, contrefacons (rassurer), livraison","Boutiques IG avec catalogues WA ; forte demande conseils","Moyen",149,"Instagram, Jumia CI beaute, groupes FB beaute CI","DM Instagram","« Diagnostic + routine + commande, sans attendre »",18,18,13,14,17),
("Cliniques / cabinets dentaires","Cote d'Ivoire — Abidjan","Prise de RDV, devis, rappels, urgences hors horaires","Cliniques avec WA sur Google Maps et sites ; Doctolib-like faible","Eleve",199,"Google Maps, annuaires sante, sites cliniques","Email pro + appel secretariat","« Secretariat qui decroche 24h/24 »",17,18,16,14,15),
("Pieces auto / mecanique","Cote d'Ivoire — Abidjan","References, compatibilite, prix, photos de pieces","Garages et casses avec WA ; groupes FB auto CI","Moyen",149,"Groupes FB auto, Google Maps (Treichville, Yopougon)","Appel + visite","« Reference + compatibilite + prix en 10 secondes »",17,17,13,14,16),
("Restaurants / gargotes","Senegal — Dakar","Commandes midi (plateaux), menus, livraison banlieue","9-10M utilisateurs WA ; Jumia SN actif ; commande par message ancree","Moyen",149,"Jumia SN (vendeurs), Google Maps Dakar, groupes FB food","Visite + appel","« Le rush de midi sans perdre une commande »",18,19,13,14,17),
("Boutiques mode / tissus","Senegal — Dakar","Modeles, tissus (wax/bazin), mesures, livraison regions","Commercantes IG tres actives ; statuts WA = canal de vente n°1","Moyen",149,"Instagram Dakar, Jiji.sn, groupes FB mode","DM Instagram","« Catalogue + mesures + livraison, auto »",18,18,13,14,17),
("Immobilier","Senegal — Dakar","Locations courtes (vacanciers), ventes, visites Almadies/Mbao","Jiji.sn + Afrimalin.sn + groupes FB immo Dakar","Moyen",169,"Jiji.sn, Afrimalin.sn, groupes FB","Message (numero public) + appel","« Visites qualifiees meme pendant la Tabaski »",18,18,14,14,17),
("Salons de coiffure / instituts","Senegal — Dakar","RDV tresses/maquillage, tarifs, acomptes Wave/OM","Salons avec WA + paiement mobile ; RDV par message","Moyen",129,"Instagram Dakar, Google Maps, Fresha (si presents)","DM Instagram","« RDV + acompte + rappel, zero no-show »",18,17,12,14,17),
("Hotels / guesthouses / auberges","Senegal — Dakar/Saly","Dispo chambres, tarifs saison, navettes, excursions","Etablissements avec bouton WA sur Google/Booking ; saison touristique","Moyen",169,"Google Maps, Booking (contacter via infos publiques)","Email + WhatsApp public","« Receptionniste qui repond a 2h du matin »",17,17,14,14,15),
("Boutiques / superettes","Mali — Bamako","Prix, dispo, livraison quartiers, credit clients","Commerce WA dominant ; Afrimalin ML ; paiement OM mature","Faible",99,"Afrimalin, groupes FB/WA business Bamako, Google Maps","Visite + groupes","« Votre boutique ouverte meme fermee »",17,17,9,13,17),
("Pharmacies","Mali / Burkina — Bamako, Ouaga","Gardes, dispo, ordonnances photo","WA sur devantures ; systeme de garde publie en ligne","Moyen",119,"Google Maps, ordres des pharmaciens (listes publiques)","Visite","« Garde + dispo + prix, reponse immediate »",17,17,12,13,16),
("Agro / produits locaux (karite, cereales)","Burkina / Mali","Commandes groupées, prix saison, livraison","Cooperatives avec WA ; export via reseaux diaspora","Faible",99,"Groupes FB agro, Afrimalin, associations","Message + appel","« Commandes et stocks geres sans carnet »",16,16,9,13,15),
("Mode / tailleurs","Benin / Togo — Cotonou, Lome","Modeles, mesures a distance, delais fetes","Tailleurs IG/FB avec WA ; pics Tabaski/fin d'annee","Moyen",119,"Instagram, groupes FB mode, Google Maps","DM Instagram","« Mesures + modele + delai, sans 40 messages »",17,18,11,13,16),
("Immobilier","Cameroun — Douala/Yaounde","Locations, ventes, arnaques (rassurer via process)","Jiji?/groupes FB immo enormes ; WA = canal de confiance","Moyen",149,"Groupes FB immo Douala/YAO, Google Maps","Message (numero public) + appel","« Dossier + visite + contrat, process carre »",17,18,13,13,16),
("Restaurants / roulottes","Cameroun — Douala","Commandes midi, menus, livraison embouteillages","Commande par message + appel ; forte densite urbaine","Moyen",139,"Google Maps, groupes FB food Douala","Visite","« Commande + livraison + paiement, sans faute »",17,18,12,13,16),
("Electronique / telephonie","Nigeria — Lagos","Specs, prix fluctuants (naira), escroqueries (rassurer)","90-100M utilisateurs WA ; Jiji.ng + Konga ; WA = canal n°1","Moyen",179,"Jiji.ng, Konga (vendeurs), Computer Village (via IG)","DM Instagram + email","« Prix du jour + fiche + garantie, instantane »",20,19,13,12,15),
("Mode / Ankara / streetwear","Nigeria — Lagos","Drops, tailles, livraison inter-etats","Vendeuses IG avec WA ; lives + statuts WA quotidiens","Moyen",179,"Instagram Lagos, Jiji.ng mode, TikTok NG","DM Instagram","« Drop vendu meme pendant que vous dormez »",20,19,13,12,15),
("Restaurants / bukas / shawarma","Nigeria — Lagos/Abuja","Commandes soir, menus, livraison (Chowdeck/Jumia Food)","Commande WA + apps ; volume enorme le soir","Moyen",179,"Jumia NG (vendeurs), Google Maps, IG food Lagos","DM + visite","« Soiree : 0 appel manque, 0 commande perdue »",20,19,13,12,15),
("Immobilier (agents)","Nigeria — Lagos","Inspections, loyers annuels, frais d'agence, arnaques","PropertyPro + Jiji.ng + IG ; WA obligatoire pour visiter","Eleve",229,"PropertyPro, Jiji.ng property, IG immo Lagos","Message (numero public) + appel","« Inspection calee + dossier verifie, auto »",20,19,16,12,15),
("Beaute / skincare / perruques","Nigeria — Lagos","Teintes, longueurs, poses, acomptes","Marche geant ; vendeuses WA Business intensives","Moyen",179,"Instagram, Jiji.ng beaute, TikTok NG","DM Instagram","« Conseil + commande + suivi pose, auto »",20,19,13,12,15),
("Mode / Ankara / kente","Ghana — Accra","Commandes sur mesure, tissus, livraison UK/USA (diaspora)","20-22M utilisateurs WA ; Jumia GH +100% croissance ; IG fort","Moyen",169,"Instagram Accra, Jumia GH, groupes FB","DM Instagram","« Sur-mesure + expédition diaspora, sans friction »",19,18,13,13,16),
("Restaurants / chop bars / grills","Ghana — Accra/Kumasi","Commandes soirees, menus, livraison","Commande par message ; Jumia Food present","Moyen",159,"Jumia GH (vendeurs), Google Maps, IG food","Visite + DM","« Soiree Detty December sans rupture »",19,18,12,13,16),
("Immobilier","Ghana — Accra","Locations expats, ventes East Legon, visites","Annonces avec WA ; forte demande expat/diaspora","Eleve",199,"Jiji Ghana, meqasa.com, IG immo","Message + appel","« Visite + contrat + paiement, process pro »",19,18,15,13,15),
("Electronique","Kenya — Nairobi","Prix M-Pesa, specs, livraison, SAV","22-26M utilisateurs WA (95%+ des internautes) ; Jumia KE","Moyen",179,"Jumia KE (vendeurs), IG Nairobi, Luthuli (via IG)","DM + email","« Prix M-Pesa + fiche + livraison, immediat »",19,18,13,12,15),
("Salons / barbershops premium","Kenya / Afrique du Sud","RDV, tarifs, abonnements","Booking via WA/IG ; Fresha present dans la region","Moyen",169,"Instagram, Google Maps, Fresha","DM + email","« RDV + rappel + fidelisation, auto »",18,17,13,12,15),
("Guesthouses / safari lodges","Kenya — Nairobi/Mombasa","Dispo, tarifs saison, transferts, excursions","Bouton WA sur sites/Google ; touristes via WhatsApp","Eleve",219,"Google Maps, sites lodges, TripAdvisor (infos publiques)","Email + WA public","« Concierge 24h/24 en 3 langues »",18,18,16,12,14),
("Traiteurs / epiceries africaines","Diaspora — France (Paris, Marseille)","Commandes week-end, plats (atieke, mafé), livraison","Commerces avec WA sur Google/IG ; communaute tres WA","Moyen",199,"Google Maps (Chateau-Rouge, Marseille), IG afro-food","Visite + DM","« Commandes du week-end gerees sans stress »",17,18,13,16,16),
("Salons afro (tresses, locks)","Diaspora — France/Belgique","RDV satures, tarifs, acomptes, modeles photo","RDV 100% par WA/IG ; listes d'attente de semaines","Moyen",199,"Instagram, Google Maps, bouche-a-oreille communaute","DM Instagram","« Agenda plein, gere tout seul »",17,19,13,16,16),
("Immobilier (agences diaspora)","Diaspora — France/Espagne","Biens au pays pour diaspora, visites video, transferts","Agences avec WA ; diaspora achete a distance via WA","Eleve",249,"Groupes FB diaspora-immo, IG, Google Maps","Message groupe + appel","« Visite video + dossier + notaire, a distance »",17,18,16,16,15),
("Boutiques afro (cosmetiques, tissus)","Diaspora — France/USA/Canada","Catalogue, envois, conseils teintes/cheveux","Boutiques IG + WA ; envois internationaux","Moyen",199,"Instagram, Google Maps diaspora","DM Instagram","« Catalogue + envoi + suivi, auto »",17,17,13,16,16),
("Restaurants africains","Diaspora — Belgique/Espagne/Italie","Commandes soir/WE, menus, livraison","Forte communaute ; WA = canal commande","Moyen",189,"Google Maps (Matonge, Lavapies), IG","Visite + DM","« Soir et WE : service sans interruption »",17,18,12,16,15),
("Cliniques / centres dentaires","Maroc — Casa/Rabat","RDV, devis (dents, laser), tourisme medical FR/ES","Cliniques avec WA + FR ; tourisme medical structure","Eleve",249,"Google Maps, sites cliniques, Doctolib-like MA","Email + WA public","« Devis + RDV + suivi post-soin, en francais »",18,18,16,13,15),
("Riads / guesthouses","Maroc — Marrakech/Fes","Dispo, tarifs, transferts, excursions desert","Bouton WA partout ; touristes FR/EN via WhatsApp","Eleve",229,"Google Maps, Booking (infos publiques), IG riads","Email + WA public","« Concierge FR/EN qui ne dort jamais »",18,18,16,13,15),
("Restaurants / cafes","Egypte — Le Caire","Commandes, menus, livraison (Talabat en parallele)","60-85M utilisateurs WA ; WA Business tres adopte","Moyen",179,"Talabat (resto partenaires), Google Maps, IG","Email + DM","« Commande + livraison + avis, sans faute »",19,18,13,12,15),
("Cliniques / centres esthetiques","Egypte / EAU","RDV, devis laser/dentaire, suivi","Vezeeta (EG) ; cliniques EAU avec WA ; clientele premium","Eleve",299,"Vezeeta, Google Maps Dubai, IG cliniques","Email + WA public","« Devis + RDV + rappel, multilingue »",19,18,17,12,14),
("E-commerce / boutiques IG","EAU / Arabie — Dubai/Riyad","Catalogue, livraison same-day, COD, retours","176% comptes WA/hab. EAU ; commerce WA + COD massif","Eleve",299,"Instagram Dubai, Noon/Amazon.ae (vendeurs), TikTok","DM + email","« Vente + COD + retours, pilote auto »",19,18,17,12,14),
("Restaurants / lanchonetes","Bresil — Sao Paulo/Rio","Pedidos noite, cardapio, entrega (iFood en parallele)","169M utilisateurs WA (99%) ; 80% parlent aux entreprises via WA","Moyen",189,"iFood (partenaires), Google Maps, IG food BR","DM + email (PT/EN)","« Cardapio + pedido + entrega, sem perder nada »",20,19,13,11,14),
("Salao de beleza / barbearias","Bresil — Sao Paulo","Agendamentos, precos, pacotes, no-show","Agendamento 100% WA ; Fresha/Booksy partiels","Moyen",179,"Instagram BR, Google Maps, Fresha","DM Instagram","« Agenda cheia, confirmacao automatica »",20,18,13,11,14),
("Imoveis (corretores)","Bresil — Sao Paulo/Rio","Visitas, precos, financiamento, condominio","Zap/VivaReal + WA ; visite via WhatsApp obligatoire","Eleve",249,"Zap Imoveis, VivaReal, QuintoAndar (annonceurs)","Message (numero public) + email","« Visita agendada + proposta, no automatico »",20,19,15,11,14),
("Restaurants / taquerias","Mexique — CDMX","Pedidos, menu del dia, entrega (Rappi en parallele)","95M utilisateurs WA (93%) ; pedido por mensaje ancre","Moyen",179,"Rappi (partenaires), Google Maps, IG food MX","DM + email (ES/EN)","« Pedido + entrega + pago, sin perder venta »",19,19,13,11,14),
("Cliniques dentaires / esthetique","Colombie — Bogota/Medellin","RDV, devis, tourisme medical","38M utilisateurs WA (94%) ; tourisme medical structure","Eleve",229,"Doctoralia CO, Google Maps, IG cliniques","Email + WA public","« Cita + presupuesto + seguimiento, auto »",19,18,15,11,14),
("Warung / resto / cloud kitchen","Indonesie — Jakarta","Pesanan, menu, GoFood en parallele, hujan (pics)","112M utilisateurs WA ; warungs avec WA + QRIS","Moyen",159,"GoFood/GrabFood (partenaires), Google Maps, IG","DM + email (EN)","« Pesanan + antar + bayar, tanpa ribet »",18,18,12,11,14),
("Boutiques mode / hijab","Indonesie / Malaisie","Katalog, ukuran, COD, resi pengiriman","Commerce IG/TikTok + WA ; COD dominant","Moyen",159,"Shopee/TikTok Shop (vendeurs), IG, WhatsApp catalogs","DM","« Katalog + order + resi, otomatis »",18,18,12,11,14),
("Salons / spas","Malaisie — KL","Booking, packages, reminders","90% WA ; Fresha present ; booking par message","Moyen",169,"Fresha, Google Maps KL, IG","Email + DM","« Booking + reminder + package, auto »",18,17,13,11,14),
("Restaurants / dhabas / cloud kitchen","Inde — Mumbai/Delhi","Orders soir, menu, Zomato en parallele","535M utilisateurs WA ; 15M+ entreprises indiennes sur WA Business","Moyen",149,"Zomato (partenaires), Google Maps, IndiaMART","Email + DM (EN)","« Menu + order + delivery, zero missed call »",18,19,12,11,14),
("Cliniques / diagnostics","Inde — metros","RDV, rapports, rappels, home sample","Justdial + WA ; volume RDV enorme","Eleve",199,"Justdial, Google Maps, Practo (infos publiques)","Email + WA public","« RDV + rapport + rappel, auto »",18,18,14,11,14),
("Sarees / ethnic wear D2C","Inde","Tailles, tissus, retours, COD","Meesho + IG + WA ; COD + retours = douleur n°1","Moyen",149,"Meesho (vendeurs), Instagram IN, Jiji-like locaux","DM + email (EN)","« Size + COD + return, handled auto »",18,18,12,11,14),
]

CAP_LABEL = {20:"Élevé",19:"Élevé",18:"Élevé",17:"Élevé",16:"Élevé",15:"Moyen",14:"Moyen",13:"Moyen",12:"Moyen",11:"Moyen",10:"Faible"}

ws = wb.active; ws.title = "Top Segments"
NCOLS = 15
style_header(ws, NCOLS, "TOP SEGMENTS — Wapp Assist (tries par priorite decroissante)",
 "C1 Domination WhatsApp · C2 Douleur/volume · C3 Capacite a payer · C4 Encaissable · C5 Accessibilite (chacun /20). Score = somme (/100). Filtres actifs, volets figes.")
headers = ["Secteur / niche","Région / Pays","Douleur précise (ventes perdues sur WhatsApp)","Signal de demande","Capacité à payer","Prix conseillé (USD)","Où les trouver (canaux réels)","Meilleur canal d'approche","Angle de message","Score /100","C1 WA","C2 Douleur","C3 Budget","C4 Paiement","C5 Accès"]
for i,h in enumerate(headers,1): ws.cell(3,i,h)

rows_sorted = sorted(SEG, key=lambda r: sum(r[9:14]), reverse=True)
for r, s in enumerate(rows_sorted, start=4):
    tot = sum(s[9:14])
    cap = CAP_LABEL.get(s[9+2], "Moyen")
    vals = [s[0],s[1],s[2],s[3],cap,s[5],s[6],s[7],s[8],None,s[9],s[10],s[11],s[12],s[13]]
    for c,v in enumerate(vals,1):
        cell = ws.cell(r,c,v); cell.font = BODY_F; cell.alignment = WRAP; cell.border = BORDER
        if r % 2 == 0: cell.fill = GREY_F
    f = ws.cell(r,10); f.value = f"=SUM(K{r}:O{r})"; f.font = Font(name="Calibri",size=11,bold=True); f.alignment = CENTER; f.border = BORDER
    f.fill = LIGHT_F
ws.column_dimensions["A"].width = 26; ws.column_dimensions["B"].width = 24
ws.column_dimensions["C"].width = 44; ws.column_dimensions["D"].width = 38
ws.column_dimensions["E"].width = 11; ws.column_dimensions["F"].width = 11
ws.column_dimensions["G"].width = 36; ws.column_dimensions["H"].width = 30
ws.column_dimensions["I"].width = 38; ws.column_dimensions["J"].width = 10
for col in "KLMNO": ws.column_dimensions[col].width = 9
for r in range(4, 4+len(rows_sorted)): ws.row_dimensions[r].height = 62
ws.conditional_formatting.add(f"J4:J{3+len(rows_sorted)}",
 CellIsRule(operator="greaterThan", formula=["80"], fill=PatternFill("solid", fgColor="10B27E"), font=Font(color="FFFFFF", bold=True)))
ws.conditional_formatting.add(f"J4:J{3+len(rows_sorted)}",
 CellIsRule(operator="between", formula=["65","80"], fill=PatternFill("solid", fgColor="FEF3C7")))
dv = DataValidation(type="list", formula1='"Faible,Moyen,Élevé"', allow_blank=True)
ws.add_data_validation(dv); dv.add(f"E4:E{3+len(rows_sorted)}")

# ================= FEUILLE 2 : PAR REGION =================
ws2 = wb.create_sheet("Par région")
style_header(ws2, 5, "PAR RÉGION — maturite WhatsApp, paiement, culture",
 "Un bloc par region : top secteurs, maturite du commerce WhatsApp, faisabilite de paiement (depuis Conakry), langue et notes culturelles.")
for i,h in enumerate(["Région","Top secteurs (priorite)","Maturité commerce WhatsApp","Faisabilité paiement","Notes culturelles / langue"],1): ws2.cell(3,i,h)
REGIONS = [
("1. AFRIQUE FRANCOPHONE — cœur (Guinée, Sénégal, Côte d'Ivoire)","Restaurants, immobilier, mode, pharmacies, salons, électronique","MAXIMALE : WhatsApp = caisse + SAV + catalogue. Statuts WA = vitrine. ~85-98% des internautes sur WA (Yazi 2026).","EXCELLENTE : Orange Money / Wave en direct (Guinée, Sénégal, CI, Mali, Burkina). Virement local possible.","Français. Relation de confiance, visite physique decisive. Pics : Tabaski, fin d'annee. Demander « patron(ne) » sur place."),
("2. AFRIQUE FRANCOPHONE — extension (Mali, Burkina, Bénin, Togo, Cameroun)","Boutiques, pharmacies, tailleurs, agro, immobilier, food","TRES FORTE : meme usages, pouvoir d'achat plus faible, ARPU a ajuster (~99 USD). Cameroun bilingue FR/EN.","BONNE : Orange Money / MTN MoMo dans tous ces pays. USDT en fallback.","Français (+ anglais au Cameroun). Marchander le prix d'entree, proposer 2 tranches."),
("3. NIGERIA / AFRIQUE ANGLOPHONE (Nigeria, Ghana, Kenya, Afrique du Sud)","Électronique, mode Ankara, food, immobilier, beaute, hotels","MAXIMALE : Nigeria ~98% des internautes sur WA, 90-100M utilisateurs ; Kenya 95%+ ; Ghana 92%. WA Business massivement adopte (15M+ entreprises indiennes ; dynamique similaire NG).","MOYENNE : pas d'Orange Money direct. USDT (TRC20) ou virement Wise. Prevoir preuve + contrat simple.","Anglais. Scripts a traduire. Direct, ROI-obsede : parler chiffres (« X commandes sauvees »). Fuseau +0/+1h."),
("4. DIASPORA AFRICAINE (France, Belgique, Espagne, Italie, USA, Canada)","Traiteurs, salons afro, immobilier diaspora, boutiques afro, restaurants","FORTE dans la communaute (commandes WE, RDV tresses via WA) ; plus faible hors communaute (France : WA 40%, RCS 70% — Infobip 2026). Cibler commerces communautaires.","EXCELLENTE : virement SEPA, Wise, carte, USDT. Les plus solvables.","Français (+ espagnol/italien). Jouer la fibre communaute + professionnalisme. Devis facture pro."),
("5. MENA / GOLFE (Maroc, Égypte, EAU, Arabie)","Cliniques, riads/hotels, restaurants, e-commerce IG, beaute","TRES FORTE : EAU 176% comptes/hab., Arabie 80%, Maroc ~98% (GWI) ; COD + WA = standard ; Talabat/Noon en parallele.","MOYENNE : USDT ou Wise ; pas d'OM. Contrats en USD, acompte 50%.","Français au Maroc, anglais/arabe ailleurs. Prestige et ponctualite. Ramadan = pic food/livraison."),
("6. AMÉRIQUE LATINE (Brésil, Mexique, Colombie)","Restaurants, salons, immobilier, cliniques","MAXIMALE MONDIALE : Bresil 99% (169M), Colombie 94%, Mexique 93% ; 70-80% parlent deja aux entreprises via WA (Aurora 2026).","FAIBLE-MOYENNE : USDT uniquement (pas d'OM). Barriere langue (PT/ES). Commencer par partenaires bilingues.","Portugais (Bresil) / espagnol. Chaleureux, demo video obligatoire. Prix 179-249 USD."),
("7. ASIE DU SUD-EST + INDE (Indonésie, Malaisie, Inde)","Food, mode/hijab, salons, D2C, cliniques","TRES FORTE : Inde 535M utilisateurs WA ; Indonesie 112M ; Malaisie 90%. Inde : 15M entreprises sur WA Business. Exceptions : Thailande (LINE) et Philippines (Viber) — eviter.","FAIBLE : USDT uniquement ; marche ultra-concurrentiel sur les prix (viser 149 USD, volume).","Anglais (+ Bahasa). Process strict, tout ecrit. Concurrence locale d'outils : vendre le « cle en main »."),
]
for r, reg in enumerate(REGIONS, start=4):
    for c,v in enumerate(reg,1):
        cell = ws2.cell(r,c,v); cell.font = BODY_F; cell.alignment = WRAP; cell.border = BORDER
        if r % 2 == 0: cell.fill = GREY_F
    ws2.row_dimensions[r].height = 78
for w, col in [(34,"A"),(38,"B"),(40,"C"),(36,"D"),(42,"E")]: ws2.column_dimensions[col].width = w

# ================= FEUILLE 3 : CANAUX DE SOURCING =================
ws3 = wb.create_sheet("Canaux de sourcing")
style_header(ws3, 6, "CANAUX DE SOURCING — lieux reels et verifies (sept. 2026)",
 "Ne jamais scraper ni acheter des listes de numeros. N'utiliser que des numeros affiches PUBLIQUEMENT par les commerces (bouton WhatsApp, annonce, Google Maps). Statut : Verifie = URL testee ; A verifier = confirmer avant usage.")
for i,h in enumerate(["Canal / plateforme","URL","Type de cible trouvée","Région","Comment l'utiliser sans spammer","Statut"],1): ws3.cell(3,i,h)
CH = [
("Jumia Nigeria","https://www.jumia.com.ng/","Vendeurs e-commerce (electronique, mode, beaute)","Nigeria","Repérer vendeurs avec boutique physique/IG, les contacter via leur canal public","Vérifié"),
("Jumia Ghana","https://www.jumia.com.gh/","Vendeurs e-commerce","Ghana","Idem : vendeurs + recherche IG du nom de boutique","À vérifier"),
("Jumia Côte d'Ivoire","https://www.jumia.ci/","Vendeurs food/mode/beaute","Côte d'Ivoire","Contacter vendeurs via infos boutique publiques","À vérifier"),
("Jumia Sénégal","https://www.jumia.sn/","Vendeurs e-commerce","Sénégal","Idem","À vérifier"),
("Jumia Kenya","https://www.jumia.co.ke/","Vendeurs e-commerce","Kenya","Idem","À vérifier"),
("Jumia Égypte","https://www.jumia.com.eg/","Vendeurs e-commerce","Égypte","Idem (anglais/arabe)","À vérifier"),
("Jumia Maroc","https://www.jumia.ma/","Vendeurs e-commerce","Maroc","Idem (français)","À vérifier"),
("Jumia Ouganda","https://www.jumia.ug/","Vendeurs e-commerce","Ouganda","Idem","À vérifier"),
("Jiji Nigeria","https://jiji.ng/","Annonces immo, auto, mode, electronique (pros)","Nigeria","Annonces avec bouton WhatsApp/numero affiche = invitation au contact","Vérifié"),
("Jiji Sénégal","https://jiji.sn/","Annonces immo, services, commerce","Sénégal","Idem (français)","Vérifié"),
("Jiji Côte d'Ivoire","https://jiji.co.ci/","Annonces immo, auto, mode","Côte d'Ivoire","Idem (français)","Vérifié"),
("Afrimalin Sénégal","https://afrimalin.sn/","Petites annonces commerces/artisans (72 000+ annonces)","Sénégal + francophone","Annonceurs pro avec coordonnees publiques","Vérifié"),
("Afrimalin (reseau francophone)","https://afrimalin.com/","Annonces BJ/BF/CM/CI/GN/ML/CD/SN","Afrique francophone","Choisir le pays, filtrer pro, contacter via annonce","À vérifier"),
("Konga","https://www.konga.com/","Vendeurs e-commerce Nigeria","Nigeria","Vendeurs avec contacts publics","Vérifié (notoriété)"),
("PropertyPro","https://www.propertypro.ng/","Agents immobiliers Nigeria","Nigeria","Agents avec numeros publics sur annonces","Vérifié (notoriété)"),
("Private Property Nigeria","https://www.privateproperty.com.ng/","Agents immobiliers","Nigeria","Idem","À vérifier"),
("MeQasa","https://meqasa.com/","Agents immobiliers Ghana","Ghana","Annonceurs avec contacts publics","À vérifier"),
("Zap Imóveis","https://www.zapimoveis.com.br/","Annonceurs immo Brésil","Brésil","Annonceurs pro (portugais)","Vérifié (notoriété)"),
("VivaReal","https://www.vivareal.com.br/","Annonceurs immo Brésil","Brésil","Idem","Vérifié (notoriété)"),
("QuintoAndar","https://www.quintoandar.com.br/","Immobilier Brésil","Brésil","Partenaires/annonceurs","Vérifié (notoriété)"),
("Vivanuncios","https://www.vivanuncios.com.mx/","Annonces Mexique (immo, auto, services)","Mexique","Annonceurs avec contacts (espagnol)","Vérifié (notoriété)"),
("Bayut","https://www.bayut.com/","Agences immo EAU","EAU","Agences avec numeros publics","Vérifié (notoriété)"),
("Property Finder","https://www.propertyfinder.ae/","Agences immo EAU","EAU","Idem","Vérifié (notoriété)"),
("Dubizzle","https://dubai.dubizzle.com/","Annonces EAU (immo, auto, services)","EAU","Annonceurs avec contacts","Vérifié (notoriété)"),
("OpenSooq","https://www.opensooq.com/","Annonces MENA","Moyen-Orient","Annonceurs (arabe/anglais)","Vérifié (notoriété)"),
("OLX Brésil","https://www.olx.com.br/","Annonces Brésil","Brésil","Annonceurs (portugais)","Vérifié (notoriété)"),
("OLX Égypte","https://www.olx.com.eg/","Annonces Égypte","Égypte","Annonceurs","À vérifier"),
("Noon","https://www.noon.com/","Vendeurs MENA","EAU/Arabie/Égypte","Vendeurs avec boutiques/IG","Vérifié (notoriété)"),
("Amazon Égypte","https://www.amazon.eg/","Vendeurs Égypte","Égypte","Vendeurs tiers (marques → IG/site)","Vérifié"),
("Amazon EAU","https://www.amazon.ae/","Vendeurs Golfe","EAU","Idem","Vérifié"),
("Mercado Libre","https://www.mercadolibre.com/","Vendeurs LatAm","Amérique latine","Vendeurs avec boutiques externes","Vérifié (notoriété)"),
("Shopee Indonésie","https://shopee.co.id/","Vendeurs ID (mode, food)","Indonésie","Vendeurs avec IG/WA publics","Vérifié (notoriété)"),
("Tokopedia","https://www.tokopedia.com/","Vendeurs Indonésie","Indonésie","Idem","Vérifié (notoriété)"),
("Meesho","https://www.meesho.com/","Vendeurs D2C Inde","Inde","Vendeurs (anglais)","Vérifié (notoriété)"),
("IndiaMART","https://www.indiamart.com/","Fournisseurs/PME Inde (B2B)","Inde","Fiches avec numeros d'affaires publics","Vérifié (notoriété)"),
("Justdial","https://www.justdial.com/","Commerces locaux Inde","Inde","Fiches avec numeros publics","Vérifié (notoriété)"),
("Fresha","https://www.fresha.com/","Salons/spa (booking)","Monde (dont MENA/Afrique du Sud)","Salons avec profils + contacts publics","Vérifié"),
("Booksy","https://booksy.com/","Salons/barbiers (booking)","Monde (dont LatAm)","Idem","Vérifié (notoriété)"),
("Vezeeta","https://www.vezeeta.com/","Cliniques/médecins MENA","Égypte/MENA","Cliniques avec contacts publics","Vérifié (notoriété)"),
("Doctoralia","https://www.doctoralia.com.mx/","Cliniques LatAm","Mexique/Colombie/Brésil","Idem (espagnol/portugais)","Vérifié (notoriété)"),
("iFood (partenaires)","https://www.ifood.com.br/","Restaurants Brésil","Brésil","Restos avec IG/WA publics","Vérifié (notoriété)"),
("Rappi (partenaires)","https://www.rappi.com/","Restaurants LatAm","Mexique/Colombie","Idem","Vérifié (notoriété)"),
("Talabat (partenaires)","https://www.talabat.com/","Restaurants MENA","Égypte/EAU","Idem","Vérifié (notoriété)"),
("Google Maps","https://www.google.com/maps","TOUS commerces (bouton WhatsApp/numero public)","Monde","Requete « restaurant + ville », n'utiliser que fiches avec WA affiche","Vérifié"),
("Instagram — recherche","https://www.instagram.com/","Boutiques, salons, food, immo","Monde","Hashtags (#BoutiqueDakar #NailsAbidjan...), bios avec lien WhatsApp = invitation","Vérifié"),
("TikTok — recherche","https://www.tiktok.com/","Vendeuses live, food, beaute","Monde","Lives « commandez sur WhatsApp », lien bio","Vérifié"),
("Facebook Marketplace","https://www.facebook.com/marketplace/","Vendeurs locaux, immo","Monde","Annonces avec bouton WhatsApp uniquement","Vérifié"),
("Facebook — recherche groupes","https://www.facebook.com/","Groupes vente ville (ex. « Vente en ligne Abidjan »)","Afrique/LatAm","Rejoindre, observer, contacter vendeurs PRO via infos publiques (jamais de blast groupe)","Méthode (noms variables)"),
("Telegram — recherche","https://telegram.org/","Canaux vente ville/pays","Afrique/MENA","Rejoindre canaux publics, contacter admins/vendeurs via contacts publies","Méthode (noms variables)"),
("CGECI (patronat CI)","https://www.cgeci.com/","Entreprises Côte d'Ivoire (annuaire membres)","Côte d'Ivoire","Annuaire membres → contacts pro publics → email/appel","Vérifié (notoriété)"),
("CCI Côte d'Ivoire","https://www.cci.ci/","Entreprises CI","Côte d'Ivoire","Idem","Vérifié (notoriété)"),
("APIP Guinée","https://apip.gov.gn/","Entreprises formelles Guinée","Guinée","Guichet/registre, contacts institutionnels","À vérifier"),
("Reddit r/smallbusiness","https://www.reddit.com/r/smallbusiness/","Petits commerces (anglophones, diaspora)","Monde/diaspora","Apporter de la valeur, jamais de spam ; flair promo respecte","Vérifié"),
("Reddit r/Entrepreneur","https://www.reddit.com/r/Entrepreneur/","Entrepreneurs","Monde/diaspora","Idem","Vérifié"),
("WhatsApp Business — bonnes pratiques","https://business.whatsapp.com/","Comprendre les regles avant de prospecter","Monde","Lire la politique de messagerie (consentement/opt-out)","Vérifié"),
("Meta — Click-to-WhatsApp Ads","https://www.facebook.com/business/ads/click-to-whatsapp","Commerces faisant deja de la pub WA (cibles chaudes)","Monde","Cibler annonceurs : ils paient deja pour du trafic WA","Vérifié (notoriété)"),
]
for r, ch in enumerate(CH, start=4):
    for c,v in enumerate(ch,1):
        cell = ws3.cell(r,c,v); cell.font = BODY_F; cell.alignment = WRAP; cell.border = BORDER
        if r % 2 == 0: cell.fill = GREY_F
        if c == 2 and isinstance(v,str) and v.startswith("http"):
            cell.font = LINK_F; cell.hyperlink = v
    ws3.row_dimensions[r].height = 44
for w, col in [(30,"A"),(30,"B"),(30,"C"),(20,"D"),(44,"E"),(16,"F")]: ws3.column_dimensions[col].width = w

# ================= FEUILLE 4 : SCORING =================
ws4 = wb.create_sheet("Scoring")
style_header(ws4, 2, "MÉTHODE DE SCORING — transparence du calcul",
 "Chaque segment est note sur 5 criteres (/20 chacun). Score final /100 = C1+C2+C3+C4+C5 (formule Excel en colonne J de « Top Segments »).")
for i,h in enumerate(["Critère (pondération effective)","Définition et barème /20"],1): ws4.cell(3,i,h)
SC = [
("C1 — Domination WhatsApp (25%)","Part des internautes sur WhatsApp + usage business : 20 = >90% (Nigeria, Bresil, Maroc) ; 18-19 = 80-90% (CI, SN, EG, EAU) ; 16-17 = 70-80% ou diaspora FR ; <16 = marche mixte (RCS/Line). Sources : Yazi 2026, Infobip 2026, Aurora 2026."),
("C2 — Douleur / volume perdu (25%)","20 = commandes/visites nocturnes massives perdues (food, immo, RDV) ; 17-19 = catalogue/prix repetes, no-shows ; <17 = volume faible ou saisonnier."),
("C3 — Capacité à payer (20%)","20-17 = marges sante/beaute/immo/hotellerie ; 12-14 = food/mode PME ; 9-11 = superettes/agro faible marge. Converti en Prix conseille : ~99 USD (faible), 115-189 (moyen), 199-299 (eleve)."),
("C4 — Encaissable depuis Conakry (15%)","20 = Orange Money/Wave direct (Guinee, SN, CI, ML, BF) ; 16 = SEPA/Wise/carte (diaspora) ; 13-14 = OM partiel + USDT ; 11-12 = USDT uniquement (NG, LatAm, Asie)."),
("C5 — Accessibilité sans spam (15%)","20-18 = visite possible (Conakry) ou DM IG massif ; 15-17 = groupes FB/annuaires avec numeros publics ; <15 = langue etrangere, email froid."),
("Lecture du score","80+ = attaquer cette semaine. 70-79 = vague 2 (diaspora + MENA). 60-69 = opportuniste (contenu inbound traduit). <60 = eviter pour l'instant (ex. USA, Thailande, Philippines)."),
("Règle d'honnêteté","Aucun numero invente ni scrape. Si une URL est marquee « A verifier », la confirmer avant usage. Les volumes WhatsApp cites viennent des sources nommees ; le reste est une estimation raisonnee, pas une donnee."),
]
for r, sc in enumerate(SC, start=4):
    for c,v in enumerate(sc,1):
        cell = ws4.cell(r,c,v); cell.font = BODY_F; cell.alignment = WRAP; cell.border = BORDER
        if r % 2 == 0: cell.fill = GREY_F
    ws4.row_dimensions[r].height = 62
ws4.column_dimensions["A"].width = 36; ws4.column_dimensions["B"].width = 120

for ws in (wb["Top Segments"], ws2, ws3, ws4):
    ws.sheet_properties.pageSetUpPr.fitToPage = True

wb.save(OUT)
print("OK:", OUT)
