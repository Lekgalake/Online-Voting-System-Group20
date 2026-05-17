import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// /vote redirects to /elections — voting is handled inline on the Elections page
const VotingPage = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/elections', { replace: true }); }, [navigate]);
  return null;
};

export default VotingPage;
