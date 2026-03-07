#!/bin/bash
# Script para aguardar o banco de dados ficar disponível

set -e

host="$1"
port="$2"
shift 2
cmd="$@"

until nc -z "$host" "$port"; do
  >&2 echo "Banco de dados não disponível em $host:$port - aguardando..."
  sleep 1
done

>&2 echo "Banco de dados disponível em $host:$port - executando comando"
exec $cmd