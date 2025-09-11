import { 
    FaUser, 
    FaUsers, 
    FaUserFriends, 
    FaHeart, 
    FaCoins, 
    FaMoneyBillWave, 
    FaGem 
} from "react-icons/fa";

export const SelectTravelList=[
        {
                id: 1,
                title: 'Just Me',
                desc: 'A solo travels in exploring the beauty of the Philippines.',
                icon: <FaUser style={{ color: '#3498db' }} />,
                people: '1'
        },
        {
                id: 2,
                title: 'Family Trip',
                desc: 'A fun-filled adventure for the whole family.',
                icon: <FaUsers style={{ color: '#27ae60' }} />,
                people: '3 to 5 People'
        },
        {
                id: 3,
                title: 'Group Tour',
                desc: 'Explore the Philippines with friends and make unforgettable memories.',
                icon: <FaUserFriends style={{ color: '#f39c12' }} />,
                people: '5 to 10 People'
        },
        {
                id: 4,
                title: 'Couple Getaway',
                desc: 'A romantic escape for couples to enjoy the beauty of the Philippines.',
                icon: <FaHeart style={{ color: '#e74c3c' }} />,
                people: '2 People'
        }
]

export const SelectBudgetOptions = [
        {
                id: 1,
                title: 'Budget',
                desc: 'A budget-friendly option for travelers looking to save money.',
                icon: <FaCoins style={{ color: '#f1c40f' }} />
        },
        {
                id: 2,
                title: 'Moderate',
                desc: 'A comfortable option for travelers who want a balance of cost and quality.',
                icon: <FaMoneyBillWave style={{ color: '#2ecc71' }} />
        },
        {
                id: 3,
                title: 'Luxury',
                desc: 'A high-end option for travelers seeking the best experiences.',
                icon: <FaGem style={{ color: '#9b59b6' }} />
        }
]

export const AI_PROMPT=`I want you to act as a travel guide. I will provide you with details about a trip, including the location, duration (in days), the number of travelers, and the budget. Based on this information, you will create a detailed travel itinerary.

The itinerary should include recommendations for:

Accommodations
Transportation
Activities
Dining options

The itinerary must be tailored to the specific needs and preferences of the travelers, taking into account their budget and interests.

My first request is:
{location}, {duration} days, {travelers}, {budget} budget. IN JSON FORMAT`

export const AI_PROMPT=`I want you to act as a travel guide. I will provide you with details about a trip, including the location, duration, number of travelers, and budget, and you will create a detailed itinerary for the trip. The itinerary should include recommendations for accommodations, transportation, activities, and dining options. The itinerary should be tailored to the specific needs and preferences of the travelers, taking into account their budget and interests. My first request is "{location}", "{duration}" days, "{travelers}", "{budget}" budget.`

