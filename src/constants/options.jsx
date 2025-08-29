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
        icon: <FaUser />,
        people: '1'
    },
    {
        id: 2,
        title: 'Family Trip',
        desc: 'A fun-filled adventure for the whole family.',
        icon: <FaUsers />,
        people: '3 to 5 People'
    },
    {
        id: 3,
        title: 'Group Tour',
        desc: 'Explore the Philippines with friends and make unforgettable memories.',
        icon: <FaUserFriends />,
        people: '5 to 10 People'
    },
    {
        id: 4,
        title: 'Couple Getaway',
        desc: 'A romantic escape for couples to enjoy the beauty of the Philippines.',
        icon: <FaHeart />,
        people: '2 People'
    }
]

export const SelectBudgetOptions = [
    {
        id: 1,
        title: 'Budget',
        desc: 'A budget-friendly option for travelers looking to save money.',
        icon: <FaCoins />
    },
    {
        id: 2,
        title: 'Moderate',
        desc: 'A comfortable option for travelers who want a balance of cost and quality.',
        icon: <FaMoneyBillWave />
    },
    {
        id: 3,
        title: 'Luxury',
        desc: 'A high-end option for travelers seeking the best experiences.',
        icon: <FaGem />
    }
]