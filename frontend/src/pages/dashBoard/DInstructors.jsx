import Users from './DUsers';

// Simple wrapper that initializes the user list with role filter = INSTRUCTOR
function Instructors() {
  return <Users initialRole="INSTRUCTOR" />;
}

export default Instructors;