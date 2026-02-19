import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar as BSNav, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faChalkboardUser } from "@fortawesome/free-solid-svg-icons";
import { authService } from "../../api/auth.service";

function Navbar(props) {
  const value = props.page;
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  const handleLogOut = async () => {
    await authService.logout();
    setIsAuthenticated(false);
  };

  return (
    <BSNav bg="light" expand="lg" className="shadow-sm sticky-top">
      <Container>
        <BSNav.Brand as={Link} to="/" className="d-flex align-items-center">
          <div className="d-flex align-items-center">
            <div style={{width:40,height:40, borderRadius:8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800}}>N2</div>
            <div className="ms-2">
              <div className="h5 mb-0">E-Learning</div>
              <small className="text-muted">Learn. Grow. Succeed.</small>
            </div>
          </div>
        </BSNav.Brand>
        <BSNav.Toggle aria-controls="basic-navbar-nav" />
        <BSNav.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/" active={value === 'home'}>Home</Nav.Link>
            <Nav.Link as={Link} to="/courses" active={value === 'courses'}>Courses</Nav.Link>

            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/profile" active={value === 'profile'}>
                  Profile <FontAwesomeIcon icon={faUser} className="ms-2" />
                </Nav.Link>
                <Nav.Link as={Link} to="/learnings" active={value === 'learnings'}>
                  Learnings <FontAwesomeIcon icon={faChalkboardUser} className="ms-2" />
                </Nav.Link>
              </>
            )}

            {isAuthenticated ? (
              <Button variant="danger" className="ms-3" onClick={handleLogOut}>Sign Out</Button>
            ) : (
              <Button variant="primary" className="ms-3" onClick={() => navigate('/login')}>Login / SignUp</Button>
            )}
          </Nav>
        </BSNav.Collapse>
      </Container>
    </BSNav>
  );
}

export default Navbar;