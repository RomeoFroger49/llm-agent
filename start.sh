#!/bin/bash

# 1. Vérifie si .env existe, sinon le crée et demande la clé API
if [ ! -f .env ]; then
  echo "Clé API OpenAI manquante. Veuillez la saisir :"
  read -s -p "OPEN_AI_KEY: " OPEN_AI_KEY
  echo
  echo "OPEN_AI_KEY=$OPEN_AI_KEY" > .env
  echo ".env créé ✅"
else
  echo ".env déjà présent ✅"
fi

# # 2. Crée le dossier memory/ s'il n'existe pas
# if [ ! -d memory ]; then
#   mkdir memory
#   echo "Dossier 'memory/' créé ✅"
# fi

# # 3. Crée storeId.json s'il n'existe pas
# if [ ! -f memory/storeId.json ]; then
#   echo "{}" > memory/storeId.json
#   echo "Fichier 'storeId.json' initialisé ✅"
# else
#   echo "Fichier 'storeId.json' déjà présent ✅"
# fi

# 4. Lance le script principal
echo "Lancement de l'agent..."
tsx main.mts
