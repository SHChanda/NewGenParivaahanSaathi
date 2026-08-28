-- Apply after Database/schema.sql. This supports the FastAPI integration only.
SET search_path TO sarathi, public;

\ir ../tables/auth_challenges.sql
\ir ../routines.sql
