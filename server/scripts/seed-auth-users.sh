#!/bin/sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:${SERVER_PORT:-3030}}"
CLIENT_ORIGIN="${CLIENT_ORIGIN:-${CLIENT_URL:-http://localhost:5173}}"
SEED_PASSWORD="${SEED_PASSWORD:-Password123!}"

signup_user() {
  first_name="$1"
  last_name="$2"
  email="$3"
  date_of_birth="$4"
  name="$first_name $last_name"
  response="$(
    curl -sS -i \
      -X POST "$BASE_URL/api/auth/sign-up/email" \
      -H "Content-Type: application/json" \
      -H "Origin: $CLIENT_ORIGIN" \
      --data "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$SEED_PASSWORD\",\"firstName\":\"$first_name\",\"lastName\":\"$last_name\",\"dateOfBirth\":\"$date_of_birth\"}"
  )"
  status_code="$(printf '%s\n' "$response" | awk 'NR == 1 { print $2 }')"

  if [ "$status_code" = "200" ] || [ "$status_code" = "201" ]; then
    echo "Created auth user: $email"
    return
  fi

  if printf '%s' "$response" | grep -qi "already\|exist\|USER_ALREADY_EXISTS"; then
    echo "Auth user already exists: $email"
    return
  fi

  echo "Failed to create auth user: $email (HTTP $status_code)" >&2
  printf '%s\n' "$response" >&2
  return 1
}

echo "Creating seed auth users through $BASE_URL/api/auth/sign-up/email"
echo "Shared seed password: $SEED_PASSWORD"

signup_user "Mila" "Admin" "mila.admin+seed@careerscope.local" "1990-01-14"
signup_user "Ivan" "Recruiter" "ivan.recruiter+seed@careerscope.local" "1988-09-02"
signup_user "Sara" "Recruiter" "sara.recruiter+seed@careerscope.local" "1992-03-19"
signup_user "Marko" "Recruiter" "marko.recruiter+seed@careerscope.local" "1986-12-04"
signup_user "Ivana" "Recruiter" "ivana.recruiter+seed@careerscope.local" "1990-08-18"
signup_user "Luka" "Recruiter" "luka.recruiter+seed@careerscope.local" "1991-06-11"
signup_user "Nina" "Recruiter" "nina.recruiter+seed@careerscope.local" "1989-10-27"
signup_user "Petar" "Candidate" "petar.candidate+seed@careerscope.local" "1997-05-22"
signup_user "Ana" "Candidate" "ana.candidate+seed@careerscope.local" "1995-11-08"
signup_user "Jovana" "Candidate" "jovana.candidate+seed@careerscope.local" "1998-07-16"
signup_user "Nikola" "Candidate" "nikola.candidate+seed@careerscope.local" "1996-02-13"
signup_user "Milica" "Candidate" "milica.candidate+seed@careerscope.local" "1999-09-24"
signup_user "Stefan" "Candidate" "stefan.candidate+seed@careerscope.local" "1994-04-30"
signup_user "Teodora" "Candidate" "teodora.candidate+seed@careerscope.local" "2000-12-05"

echo "Seed auth users are ready."
