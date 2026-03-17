#!/usr/bin/env bash
# Bill Extractor CLI
# Usage: bill.sh <command> [args...]

set -eu

CONFIG_FILE="${BILL_CONFIG:-$(dirname "$0")/bill.conf}"

if [[ -f "$CONFIG_FILE" ]]; then
  set -a; source <(sed 's/\r//' "$CONFIG_FILE"); set +a
fi

: "${BILL_URL:?Set BILL_URL or configure $CONFIG_FILE}"
: "${DOWNLOAD_DIR:=$(pwd)}"

cmd="${1:-help}"
shift || true

api() {
  local url="$1"; shift || true
  local -a args=(curl -sS --max-time 120)

  local tmp http_code
  tmp=$(mktemp)
  http_code=$("${args[@]}" -o "$tmp" --write-out "%{http_code}" "$url" "$@") || {
    echo "curl error (exit $?) — verifique URL e conectividade" >&2
    rm -f "$tmp"
    return 1
  }

  if [[ "$http_code" -ge 400 ]]; then
    echo "HTTP $http_code" >&2
    cat "$tmp" >&2
    rm -f "$tmp"
    return 1
  fi

  cat "$tmp"
  rm -f "$tmp"
}

api_file() {
  local url="$1" out="$2"
  curl -sS --max-time 120 -o "$out" "$url"
}

json() {
  if command -v jq &>/dev/null; then jq; else cat; fi
}

case "$cmd" in
  saneago:list)
    api "$BILL_URL/saneago/list" | json
    ;;

  saneago:download)
    # bill.sh saneago:download <numero>
    numero="${1:?Usage: bill.sh saneago:download <numero>}"
    out="${DOWNLOAD_DIR}/saneago-$(date +%Y%m%d%H%M%S).pdf"
    api_file "$BILL_URL/saneago/download/$numero" "$out"
    echo "Fatura Saneago #${numero}:"
    echo "MEDIA:${out}"
    ;;

  saneago:download-all)
    out="${DOWNLOAD_DIR}/saneago-all-$(date +%Y%m%d%H%M%S).pdf"
    api_file "$BILL_URL/saneago/download-all" "$out"
    echo "Faturas Saneago (todas):"
    echo "MEDIA:${out}"
    ;;

  help|*)
    cat <<EOF
Bill Extractor CLI

Usage: bill.sh <command> [args...]

Commands:
  saneago:list              Lista faturas Saneago em aberto
  saneago:download <num>    Baixa a fatura Saneago pelo número (use list para ver)
  saneago:download-all      Baixa todas as faturas Saneago em aberto

Environment:
  BILL_URL      URL da API (obrigatório)
  DOWNLOAD_DIR  Diretório para salvar PDFs (padrão: diretório atual)
  BILL_CONFIG   Caminho para o config (padrão: ./bill.conf)

Examples:
  bill.sh saneago:list
  bill.sh saneago:download 1
  bill.sh saneago:download-all
EOF
    ;;
esac
