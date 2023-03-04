import React, { useEffect, useState, useRef } from 'react';
import IosShareIcon from '@mui/icons-material/IosShare';
import Menu from '@mui/material/Menu';
import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LinkIcon from '@mui/icons-material/Link';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import ForumIcon from '@mui/icons-material/Forum';
import config from '../../config';
import ShareIcon from '@mui/icons-material/Share';

import { useNavigate } from 'react-router-dom';
import FriendItem from '../MyPage/Friend/FriendItem';
import { Container } from '@mui/material';
import axios from 'axios';
import { friendData } from '../../types/type';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import styled from 'styled-components';
import { BiLibrary } from 'react-icons/bi';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import { Button } from '@mui/material';
import html2canvas from 'html2canvas';
import Popover from '@mui/material/Popover';

export interface SnackbarMessage {
    message: string;
    key: number;
}

export interface State {
    open: boolean;
    snackPack: readonly SnackbarMessage[];
    messageInfo?: SnackbarMessage;
}

//
const TextArea = styled.textarea`
    position: absolute;
    width: 0px;
    height: 0px;
    bottom: 0;
    left: 0;
    opacity: 0;
`;

const inputSx = {
    width: '100%',
    '& .MuiOutlinedInput-root': {
        '&.Mui-focused fieldset': {
            borderColor: '#6666cc',
        },
        '&:hover fieldset': {
            borderColor: '#6666cc',
        },
    },
};

const InputTextField = styled(TextField)({
    '& label': {
        color: '#333',
    },
    '& label.Mui-focused': {
        color: '#333',
    },
    '& .MuiOutlinedInput-root': {
        color: '#333',
        '& fieldset': {
            borderColor: '#333',
        },
    },
});

const TodoItemBlock = styled.div`
    &:hover {
        ${'#button'} {
            display: initial;
        }
    }
`;

const CardBox = styled.div`
    background-position: center;
    background-size: cover;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.3);
    text-align: center;
    border-radius: 1rem;
    padding: 1rem;
`;

const Share = (props: any) => {
    const [friendList, setFriendList] = useState([]);
    const [allFriendList, setAllFriendList] = useState([]);
    React.useEffect(function () {
        axios({
            method: 'get',
            url: `/friend/`,
            withCredentials: true,
        })
            .then(function (result) {
                setFriendList(result.data);
                setAllFriendList(result.data);
            })
            .catch(function (error) {
                console.error('friend 에러발생: ', error);
            });
    }, []);

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [toast, setToast] = React.useState(false);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const toastOpen = () => {
        setToast(true);
    };
    const toastClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setToast(false);
    };

    const searchSpace = (event: any) => {
        const keyword = event.target.value;
        setFriendList(
            allFriendList?.filter((data: friendData) => {
                if (data.nickname.toLowerCase().includes(keyword.toLowerCase()) || data.email.toLowerCase().includes(keyword.toLowerCase())) {
                    return data;
                }
            }),
        );
    };
    const expression = 'happy';
    let friend = '';
    const sendMail = () => {
        console.log('onCapture');
        html2canvas(document.getElementById('chart') as HTMLElement)?.then((canvas) => {
            const imgData = canvas.toDataURL('image/jpeg', 0.3);
            console.log(imgData, (document.getElementById('outlined-search') as HTMLInputElement).value);
            axios({
                method: 'post',
                url: `/mail`,
                withCredentials: true,
                data: {
                    email: (document.getElementById('outlined-search') as HTMLInputElement).value,
                    image: imgData,
                    friend: friend,
                    expression: expression,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(function (result) {
                    toastOpen();
                })
                .catch(function (error) {
                    console.error('mail 에러발생: ', error);
                });
        });
    };

    const copyUrlRef = React.useRef<HTMLTextAreaElement>(null);

    return (
        <div>
            <IconButton type="button" onClick={handleClick}>
                <ShareIcon sx={{ color: 'white' }} />
            </IconButton>
            <Popover
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                sx={{ paddding: 0 }}
            >
                <Container sx={{ backgroundColor: '#333' }}>
                    <h4 style={{ color: '#333' }}>친구 목록</h4>
                    <div>
                        <CardBox style={{ display: 'flex', flexDirection: 'row' }}>
                            <InputTextField id="outlined-search" label="" type="search" sx={inputSx} onChange={(e) => searchSpace(e)} />
                            <Button aria-label="send" sx={{ p: 0.5, color: '#6666cc' }} onClick={sendMail}>
                                <ForwardToInboxIcon fontSize="medium" />
                            </Button>
                        </CardBox>
                    </div>
                    {friendList.length !== 0 ? (
                        <div style={{ paddingTop: '2em', paddingBottom: '2em' }}>
                            <CardBox>
                                <List sx={{ overflow: 'auto', height: '400px' }}>
                                    {friendList.map((item: friendData) => (
                                        <TodoItemBlock
                                            key={item.user_id}
                                            onClick={() => {
                                                (document.getElementById('outlined-search') as HTMLInputElement).value = item.email;
                                                friend = item.nickname;
                                            }}
                                        >
                                            <ListItem alignItems="flex-start" sx={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
                                                <FriendItem nickname={item.nickname} email={item.email} img={item.profile_img} />
                                            </ListItem>
                                            <hr></hr>
                                        </TodoItemBlock>
                                    ))}
                                </List>
                            </CardBox>
                        </div>
                    ) : (
                        <div style={{ paddingTop: '2em', paddingBottom: '2em' }}>
                            <CardBox>
                                <div style={{ color: '#333' }}>친구 목록이 비었습니다.</div>
                            </CardBox>
                        </div>
                    )}
                </Container>
            </Popover>
            <Snackbar
                open={toast}
                onClose={toastClose}
                message={'이메일이 발송되었습니다.'}
                action={
                    <React.Fragment>
                        <IconButton aria-label="close" color="inherit" sx={{ p: 0.5 }} onClick={toastClose}>
                            <CloseIcon />
                        </IconButton>
                    </React.Fragment>
                }
            />
        </div>
    );
};
export default Share;
