import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

// Remove any old imports from '../integrations/firebase/config'
import { auth, db, googleProvider } from '../lib/Firebase';
import { useAuth } from './AuthContext';

const ComplaintContext = createContext();
// const db = getFirestore();

export function ComplaintProvider({ children }) {
  const { user, isGovernment } = useAuth();
  // const { user, isGovernment } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Complaints (Related to current user)
  const fetchComplaints = useCallback(async () => {
    // GUARD: If user is not logged in yet, stop here.
    if (!user || !user.id) {
      console.log("Waiting for user ID...");
      return;
    }

    setLoading(true);
    try {
      const complaintsRef = collection(db, "complaints");
      let q;

      if (isGovernment) {
        q = query(complaintsRef, orderBy("created_at", "desc"));
      } else {
        // Now user.id is guaranteed to be a string, not undefined
        q = query(
          complaintsRef,
          where("user_id", "==", user.id),
          orderBy("created_at", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(fetched);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isGovernment]);

  useEffect(() => {
    // Only fetch if we actually have a valid user ID
    if (user?.id) {
      fetchComplaints();
    }
  }, [user?.id, fetchComplaints]); // Dependency on user.id specifically

  // 2. Add Complaint (Storing the User's UID for the link)
  const addComplaint = async (complaintData) => {
    if (!user) return null;

    try {
      const complaintNumber = `GRV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const newComplaint = {
        user_id: user.id, // CRITICAL: This links the complaint to the User Document
        complaint_number: complaintNumber,
        citizen_email: user.email,
        citizen_name: complaintData.citizenName || user.name || 'Anonymous',
        description: complaintData.description,
        category: complaintData.category || 'General',
        location: complaintData.location,
        status: 'Pending',
        created_at: serverTimestamp(),
        history: [{
          status: 'Pending',
          note: 'Complaint registered in system',
          timestamp: Date.now()
        }]
      };

      const docRef = await addDoc(collection(db, "complaints"), newComplaint);
      await fetchComplaints();
      return { id: docRef.id, ...newComplaint };
    } catch (error) {
      console.error("Error adding complaint:", error);
      return null;
    }
  };

  // 3. Update Status & Trigger Notification Logic
  const updateStatus = async (complaintDocId, newStatus) => {
    try {
      const complaintRef = doc(db, "complaints", complaintDocId);
      const complaintSnap = await getDoc(complaintRef);

      if (!complaintSnap.exists()) return;
      const complaintData = complaintSnap.data();

      // Update the complaint status and history
      await updateDoc(complaintRef, {
        status: newStatus,
        history: [...(complaintData.history || []), {
          status: newStatus,
          note: `Officer updated status to ${newStatus}`,
          timestamp: Date.now()
        }]
      });

      // RELATION LINKAGE: Find the user to notify them
      const userRef = doc(db, "users", complaintData.user_id);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log(`Ready to notify ${userData.name} at ${userData.email}`);

        // TRIGGER NOTIFICATION: Call your FastAPI endpoint here
        // await fetch('http://localhost:8000/send-notification', {
        //   method: 'POST',
        //   body: JSON.stringify({ email: userData.email, status: newStatus })
        // });
      }

      await fetchComplaints();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <ComplaintContext.Provider value={{ complaints, loading, addComplaint, updateStatus, fetchComplaints }}>
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  return useContext(ComplaintContext);
}