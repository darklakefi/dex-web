#!/bin/bash

# Check for help flags
for arg in "$@"; do
  if [[ "$arg" == "--help" || "$arg" == "-h" ]]; then
    npx uncomment --help
    exit 0
  fi
done

if [ $# -eq 0 ]; then
  echo "Usage: pnpm uncomment [options] <path>"
  echo ""
  echo "Examples:"
  echo "  pnpm uncomment --dry-run apps/web/src/components/    # Preview changes"
  echo "  pnpm uncomment apps/web/src/hooks/                  # Remove comments"
  echo "  pnpm uncomment --remove-todo apps/web/src/utils/    # Remove TODOs too"
  echo ""
  echo "See DEVELOPMENT.md for full documentation."
else
  # Check if --threads is already specified
  has_threads=0
  for arg in "$@"; do
    if [[ "$arg" == "--threads" ]]; then
      has_threads=1
      break
    fi
  done

  if [ $has_threads -eq 0 ]; then
    npx uncomment --threads 0 "$@"
  else
    npx uncomment "$@"
  fi
fi