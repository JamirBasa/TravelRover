import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '@/config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import InfoSection from '../components/InfoSection';
 
function ViewTrip() {

    const {tripId}=useParams();

    const [trip,setTrip]=useState([]);

    useEffect(()=>{
        tripId&&GetTripData();
    },[tripId])



    /*
    
        Fetch trip data from Firestore using the tripId
    
    */
    const GetTripData=async()=>{
        const docRef=doc(db, 'AITrips', tripId);
        const docSnap=await getDoc(docRef);


        if(docSnap.exists()){
            console.log("Document data:", docSnap.data());
            setTrip(docSnap.data());
        }else{
            console.log("No such document!");
            toast("No such document!");
        }
        
    }
  

  return (
    <div className='p-10 md:px-20 lg:px-40 xl:px:60'>
        {/* Information Section */}
        <InfoSection trip={trip} />
        {/* Recommended Hotels */}

        {/* Daily Plan */}

        {/* Footer */}
    </div>
  )
}

export default ViewTrip
