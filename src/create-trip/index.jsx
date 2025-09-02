import { useState, useEffect } from 'react'
import GooglePlacesAutocomplete from 'react-google-places-autocomplete'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SelectBudgetOptions, SelectTravelList, AI_PROMPT } from '../constants/options';
import { toast } from "sonner"
import { chatSession } from '../config/aimodel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FcGoogle } from 'react-icons/fc';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';


function CreateTrip() {
  const [place,setPlace]=useState(null);
  const [formData, setFormData]= useState({});
  const [openDialog,setOpenDialog]=useState(false);
  const [loading,setLoading]=useState(false);

  
  const handleInputChange=(name,value)=>{

    setFormData({ 
      ...formData,
      [name]:value
    })
  }
  useEffect(()=>{
    console.log(formData)  
  },[formData])

  const googleLogin=useGoogleLogin({
    onSuccess:(codeResp)=>GetUserProfile(codeResp),
    onError:(error)=>console.log(error)
  })
  const OnGenerateTrip= async ()=>{
    const user =localStorage.getItem('user');

    if(!user){
      setOpenDialog(true);
      return ;
    }

    if(formData?.duration>5&&!formData?.location ||!formData?.budget&& !formData?.travelers){
      toast("Please fill all the details.")
      return;
    }
    setLoading(true);
    const FINAL_PROMPT=AI_PROMPT
    .replace('{location}', formData?.location)
    .replace('{duration}', formData?.duration)
    .replace('{travelers}', formData?.travelers)
    .replace('{budget}', formData?.budget)

    console.log(FINAL_PROMPT);

    try {
      const result = await chatSession.sendMessage(FINAL_PROMPT);
      console.log("Generated trip:", result?.response.text());
      setLoading(false);
      SaveAiTrip(result?.response.text());
      
      // Use the result here
    } catch (error) {
      toast("Error generating trip: " + error.message);
    }
  }

  const SaveAiTrip=async(TripData)=>{
    setLoading(true);

    try {
      const user=JSON.parse(localStorage.getItem('user'));
      const docId=Date.now().toString()
      await setDoc(doc(db, "AITrips", docId), {
        userSelection:formData,
        tripData:TripData,
        userEmail:user?.email,
        id:docId
      });
      toast("Trip saved successfully!");
    } catch (error) {
      console.error("Error saving trip: ", error);
      toast("Failed to save trip: " + (error.message || "Permission denied"));
    }
    
    setLoading(false);
  }

  const GetUserProfile=(tokenInfo) => {
      axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`, {
        headers: {
          Authorization: `Bearer ${tokenInfo?.access_token}`, 
          Accept:'Application/json'
        }, 
      }).then((resp)=>{
        console.log(resp);
        localStorage.setItem('user',JSON.stringify(resp.data));
        setOpenDialog(false);
        OnGenerateTrip();
      })
      .catch((error) => {
        console.error("Error fetching user profile:", error);
        toast("Failed to get user profile");
      });
    }

  return (
    <div className='sm:px-10 md:px-32 lg:px-56 xl:px-72 px-5 mt-10'>
      <h2 className='text-3xl font-bold'>Customize your adventure</h2>
      <p className='mt-3 text-gray-500 text-xl'>Tell us a little about yourself, and Travel Rover will craft a personalized itinerary designed around your preferences.</p>
    
      <div className='mt-20 flex flex-col gap-10'>
          <div className='mb-8'>
            <h2 className='text-xl mb-3 font-medium'>Where would you like to go?</h2>
            <GooglePlacesAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_PLACE_API_KEY}
              autocompletionRequest={{
                componentRestrictions: {
                  country: ['ph']
                }
              }}
              selectProps={{
                value: place,
                onChange: (v) => { setPlace(v);  handleInputChange('location', v.label)} ,
              }}
            />
          </div>

          <div className='mb-8'>
            <h2 className='text-xl mb-3 font-medium'>How many days will your trip last?</h2>
            <Input placeholder={''} type='number' 
              onChange={(e)=>handleInputChange('duration', e.target.value)}
            />
          </div>
          
          <div className='mb-8'>
            <h2 className='text-xl mb-3 font-medium'>Enter your estimated budget</h2>
            <div className='grid grid-cols-3 gap-5 mt-5'>
              {SelectBudgetOptions.map((item,index)=>(
                <div key={index} 
                onClick={()=>handleInputChange('budget', item.title)}
                className={`p-4 cursor-pointer border rounded-lg hover:shadow-lg
                ${formData?.budget==item.title&&'shadow-lg border-black'}
                `}>
                  <h2 className='text-4xl'>{item.icon}</h2>
                  <h2 className='font-bold text-lg'>{item.title}</h2>
                  <h2 className='text-sm text-gray'>{item.desc}</h2>
                </div>
              ))}
            </div>
          </div>


          <div className='mb-8'>
            <h2 className='text-xl mb-3 font-medium'>Who will be joining you on your adventure?</h2>
            <div className='grid grid-cols-3 gap-5 mt-5'>
              {SelectTravelList.map((item,index)=>(
                <div key={index} 
                onClick={()=>handleInputChange('travelers', item.people)}
                className={`p-4 cursor-pointer border rounded-lg hover:shadow-lg
                ${formData?.travelers==item.people&&'shadow-lg border-black'}
                `}>
                  <h2 className='text-4xl'>{item.icon}</h2>
                  <h2 className='font-bold text-lg'>{item.title}</h2>
                  <h2 className='text-sm text-gray'>{item.desc}</h2>
                </div>
              ))}
            </div>
          </div>
          
          <div className='my-10 flex justify-end'>
            <Button 
              disabled={loading}
            onClick={OnGenerateTrip}>
              {loading?
                  <AiOutlineLoading3Quarters className='h-7 w-7 animate-spin'/>: 'Generate Trip'
              }
              </Button>
          </div>
          

          <Dialog open={openDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center">
                <img src="/logo.svg" alt="Logo" className="h-16 w-auto" />
                <span className="ml-2 text-xl font-bold text-gray-800">Travel Rover</span>
              </DialogTitle>
              <div className="mt-5">
                <Button
                className='w-full mt-5 flex gap-4 items-center'
                onClick={() => googleLogin()}>
                <FcGoogle />
                  Sign In With Google
                </Button>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}

export default CreateTrip
