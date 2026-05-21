import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function DigiLockerCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state === localStorage.getItem('dg_state')) {
      // 1. Validate the code with your Python Backend
      fetch('http://localhost:8002/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      .then(res => res.json())
      .then(data => {
        // 2. NAVIGATE BACK TO SIGNUP: This is where we trigger the "Verified" state
        navigate('/signup', { 
          state: { 
            verifiedUid: data.uid, 
            userName: data.name 
          },
          replace: true // Clean up history
        });
      })
      .catch(() => navigate('/signup', { state: { error: "Verification Failed" } }));
    }
  }, [searchParams, navigate]);

  return <div className="loading">Linking DigiLocker Account...</div>;
}