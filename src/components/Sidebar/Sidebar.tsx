import React, { useState } from 'react';
import styled from 'styled-components';
import { Navigation } from 'react-minimal-side-navigation';
import { Icon } from 'semantic-ui-react';
import { Link, useNavigate } from 'react-router-dom';
import 'react-minimal-side-navigation/lib/ReactMinimalSideNavigation.css';
import '../../styles/List.css';
import { OpacityRounded } from '@mui/icons-material';



const Area = styled.div`
    float: left;
    top: 150px;
    width: 200px;
    padding-top: 10px;
    background-color: #e2e8f0;
`;


export default function Sidebar() {
    const navigate = useNavigate();

    return (
        <>
            <Area>
                <Navigation
                    activeItemId="/management/members"
                    onSelect={({ itemId }) => {
                        navigate(itemId);
                    }}
                    items={[
                        {
                            title: 'ON Air',
                            itemId: '/',
                            elemBefore: () => <Icon name="record" style={{ fontSize: '1.2rem' }} />,
                        },

                        {
                            title: 'Album',
                            itemId: '/album',
                            elemBefore: () => <Icon name="book" />,
                        },

                        {
                            title: 'Video',
                            itemId: '/video',
                            elemBefore: () => <Icon name="video play" />,
                        },

                        {
                            title: 'My Album',
                            itemId: '/myalbum',
                            elemBefore: () => <Icon name="folder open" />,
                            subNav: [
                                {
                                    title: '1st Album',
                                    itemId: '/myalbum/1album',
                                    // Requires v1.9.1+ (https://github.com/abhijithvijayan/react-minimal-side-navigation/issues/13)
                                },
                                {
                                    title: '2nd Album',
                                    itemId: '/myalbum/2album',
                                },
                                {
                                    title: '3rd Album',
                                    itemId: '/myalbum/3album',
                                },
                            ],
                        },
                    ]}
                />
            </Area>
        </>
    );
}


// import React, { useState } from 'react';
// import styled from 'styled-components';
// import { Navigation } from 'react-minimal-side-navigation';
// import { Icon } from 'semantic-ui-react';
// import 'react-minimal-side-navigation/lib/ReactMinimalSideNavigation.css';
// import '../../css/List.css'

// const Area = styled.div`
//   float:left;
//   top: 150px;
//   width: 230px;
//   height: 100%;
//   background-color:#e2e8f0;
// `;


// export default function Sidebar() {

//   const [close, setClose] = useState(false);
//   const handleClose = () => {
//     setClose(!close);
//   }

//   // () => {setClose(close)}

//   const [hide, setHide] = useState(true);



//   return (
//     <>

//       <div
//         className={`list ${close ? 'close' : 'open'}`}
//         onClick={() => setHide(false)}
//       // onMouseLeave={() => setHide(true)}
//       >
//         <button
//           value='닫아'
//           className={
//             `hover-close
//               ${close ? '' : 'open'}
//               ${hide ? 'hide' : ''}`
//           }
//           onClick={handleClose}
//         >

//         </button>
//         {!close && (

//           <Area>

//             <Navigation
//               activeItemId="/management/members"
//               onSelect={({ itemId }) => {
//                 // maybe push to the route
//               }}
//               items={[
//                 {
//                   title: 'ON Air',
//                   itemId: '/onAir',
//                   elemBefore: () => <Icon name="record" style={{ fontSize: '1.2rem' }} />,
//                 },

//                 {
//                   title: 'Album',
//                   itemId: '/album',
//                   elemBefore: () => <Icon name="book" />,
//                 },

//                 {
//                   title: 'Video',
//                   itemId: '/video',
//                   elemBefore: () => <Icon name="video play" />,
//                 },

//                 {
//                   title: 'My Album',
//                   itemId: '/myAlbum',
//                   elemBefore: () => <Icon name="folder open" />,
//                   subNav: [
//                     {
//                       title: '1st Album',
//                       itemId: '/myalbum/1stAlbum',
//                       // Requires v1.9.1+ (https://github.com/abhijithvijayan/react-minimal-side-navigation/issues/13)

//                     },
//                     {
//                       title: '2nd Album',
//                       itemId: '/myalbum/1stAlbum',

//                     },
//                     {
//                       title: '3rd Album',
//                       itemId: '/myalbum/3rdAlbum',

//                     },
//                   ],
//                 },
//               ]}
//             />
//           </Area>
//         )}
//       </div>

//     </>

//   );
// }