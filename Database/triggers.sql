DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS applications_set_updated_at ON applications;
CREATE TRIGGER applications_set_updated_at BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS application_personal_details_set_updated_at ON application_personal_details;
CREATE TRIGGER application_personal_details_set_updated_at BEFORE UPDATE ON application_personal_details
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS application_tasks_set_updated_at ON application_tasks;
CREATE TRIGGER application_tasks_set_updated_at BEFORE UPDATE ON application_tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
