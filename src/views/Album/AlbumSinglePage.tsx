import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import { useParams } from 'react-router-dom';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import axios from 'axios';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styled from 'styled-components';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import OutletIcon from '@mui/icons-material/Outlet';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SentimentVeryDissatisfiedRoundedIcon from '@mui/icons-material/SentimentVeryDissatisfiedRounded';
import SickIcon from '@mui/icons-material/Sick';
import config from '../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { faEdit } from '@fortawesome/free-regular-svg-icons';
import { faCircleDown } from '@fortawesome/free-regular-svg-icons';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import dayjs from 'dayjs';
import frame from '../../assets/frame.png';
import Modal from '@mui/material/Modal';
import { Box } from '@mui/system';
import { Typography, Button } from '@mui/material';
import Share from './Share';
import DownloadIcon from '@mui/icons-material/Download';
import { url } from 'inspector';
import { useDispatch } from 'react-redux';
import { CARD_UPDATE_REQUEST } from '../../redux/types';

const StyleContent = styled.div`
    background-color: #fff;
    font-family: IBMPlexSansKR-Regular;
    display: flex;
    height: auto;
    text-align: center;
    margin-top: -16px;
`;

const AlbumSingle = styled.section`
    display: block;
    text-align: center;
    margin: 20px auto;
`;

// 삭제 모달창
const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'white',
    boxShadow: 24,
    p: 4,
};

interface IProps {
    albumId: any;
    cardId: any;
    comment: any;
    createdAt: any;
    expressionLabel: any;
    thumbnailUrl: any;
    updatedAt: any;
    userId: any;
    videoUrl: any;
}

const AlbumSinglePage = () => {
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [cardAlbum, setCardAlbum] = useState<IProps>({
        albumId: '',
        cardId: '',
        comment: '',
        createdAt: '',
        expressionLabel: '',
        thumbnailUrl: '',
        updatedAt: '',
        userId: '',
        videoUrl: '',
    });

    const emotionType: any = (): any => {
        if (cardAlbum.expressionLabel == 'happy') {
            return <InsertEmoticonIcon />;
        } else if (cardAlbum.expressionLabel == 'angry') {
            return <LocalFireDepartmentIcon />;
        } else if (cardAlbum.expressionLabel == 'fearful') {
            return <SentimentVeryDissatisfiedRoundedIcon />;
        } else if (cardAlbum.expressionLabel == 'surprised') {
            return <OutletIcon />;
        } else if (cardAlbum.expressionLabel == 'sad') {
            return <SentimentDissatisfiedIcon />;
        } else if (cardAlbum.expressionLabel == 'disgusted') {
            return <SickIcon />;
        }
    };

    const { cardId } = useParams();

    // put
    const ref: any = useRef(null);
    const [text, setText] = useState(cardAlbum.comment);
    const [editable, setEditable] = useState(false);

    const editOn = () => {
        setEditable(true);
        setText(cardAlbum.comment);
    };

    const handleChange = (e: any) => {
        setText(e.target.value);
    };
    const handleKeyDown = (e: any) => {
        if (e.key === 'Enter') {
            setEditable(false);
            cardAlbum.comment = text;
            dispatch({
                type: CARD_UPDATE_REQUEST,
                payload: {
                    card_id: cardAlbum.cardId,
                    user_id: cardAlbum.userId,
                    album_id: cardAlbum.albumId,
                    expression_label: cardAlbum.expressionLabel,
                    comment: text,
                    thumbnail_url: cardAlbum.thumbnailUrl,
                    video_url: cardAlbum.videoUrl,
                },
            });
            history.go(0);
        }
    };

    const handleClickOutside = (e: any) => {
        if (editable === true && !ref.current.contains(e.target)) setEditable(false);
    };

    useEffect(() => {
        window.addEventListener('click', handleClickOutside, true);
    });

    // get
    useEffect(() => {
        axios({
            method: 'get',
            url: `http://${config.server.host}:${config.server.port}/card/${cardId}`,
            withCredentials: true,
        })
            .then(function (result) {
                setCardAlbum(result.data);
                emotionType();
            })
            .catch(function (error) {
                console.log(error);
            });
    }, []);

    // delete
    const onClickDelete = () => {
        axios({
            method: 'delete',
            url: `http://${config.server.host}:${config.server.port}/card/${cardId}`,
            withCredentials: true,
        })
            .then(function (response) {
                console.log(response.status);
                // window.location.replace(`http://${config.client.host}:${config.client.port}/video`);
                window.location.reload();
            })
            .catch(function (error) {
                console.log(error);
            });
    };

    return (
        <>
            <div>
                <Header />
                <span>
                    <hr />
                </span>
                <StyleContent>
                    <Sidebar />

                    <AlbumSingle>
                        <h1>My video</h1>
                        <div>
                            <img src={frame} height="500px" style={{ width: '600px', position: 'absolute' }}></img>
                            <video
                                controls
                                loop
                                src={`https://${config.aws.bucket_name}.s3.${config.aws.region}.amazonaws.com/${cardAlbum.videoUrl}`}
                                width="600px"
                                height="460px"
                            ></video>
                        </div>
                        <div>
                            <div
                                style={{
                                    borderRadius: '5px',
                                    borderStyle: 'solid',
                                    borderColor: 'grey',
                                    width: '100px',
                                    marginTop: '50px',
                                }}
                            >
                                {emotionType()}
                                {cardAlbum.expressionLabel}
                            </div>

                            <div style={{ textAlign: 'right', padding: '10px' }}>
                                <button
                                    type="button"
                                    onClick={editOn}
                                    style={{
                                        outline: 'none',
                                        borderRadius: '50%',
                                        border: '1.5px solid #221718',
                                        boxShadow: '3px 3px 1px gray',
                                        borderColor: 'black',
                                        backgroundColor: 'white',
                                        color: 'whitesmoke',
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEdit} size="lg" style={{ color: '#1d1d1d' }} />
                                </button>

                                <button
                                    onClick={handleOpen}
                                    style={{
                                        outline: 'none',
                                        borderRadius: '50%',
                                        border: '1.5px solid #221718',
                                        boxShadow: '3px 3px 1px gray',
                                        borderColor: 'black',
                                        backgroundColor: 'white',
                                        color: 'whitesmoke',
                                        margin: '10px',
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} size="lg" style={{ color: '#1d1d1d' }} />
                                </button>
                                <a href={`https://${config.aws.bucket_name}.s3.${config.aws.region}.amazonaws.com/${cardAlbum.videoUrl}`} download>
                                    <button
                                        style={{
                                            outline: 'none',
                                            borderRadius: '60%',
                                            border: '1.5px solid #221718',
                                            boxShadow: '3px 3px 1px gray',
                                            borderColor: 'black',
                                            backgroundColor: 'white',
                                            color: 'black',
                                            margin: '2px',
                                            padding: '2px 4px',
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faCircleDown} size="lg" style={{ color: '#1d1d1d' }} />

                                        {/* <DownloadIcon /> */}
                                    </button>
                                </a>
                                <Share img={cardAlbum.thumbnailUrl} comment={cardAlbum.comment} />
                                <Modal
                                    open={open}
                                    onClose={handleClose}
                                    aria-labelledby="modal-modal-title"
                                    aria-describedby="modal-modal-description"
                                >
                                    <Box sx={style}>
                                        <Typography id="modal-modal-title" variant="h6" component="h2">
                                            정말 삭제하시겠습니까?
                                        </Typography>
                                        <Typography fontSize={13} color="#64748b" id="modal-modal-description" sx={{ mt: 2, mb: 2 }}>
                                            삭제된 앨범의 영상은 Video 탭에서 계속 볼 수 있습니다.
                                        </Typography>
                                        <Typography align="right">
                                            <Link to="/video">
                                                <Button onClick={onClickDelete}>확인</Button>
                                            </Link>
                                            <Button onClick={handleClose}>취소</Button>
                                        </Typography>
                                    </Box>
                                </Modal>
                            </div>

                            <h4>
                                comment
                                <br />
                            </h4>
                            {editable ? (
                                <div>
                                    <form>
                                        <input
                                            type="text"
                                            value={text}
                                            onChange={(e) => handleChange(e)}
                                            onKeyDown={handleKeyDown}
                                            style={{
                                                outline: 'none',
                                                borderRadius: '30px',
                                                border: '1.5px solid #221718',
                                                fontSize: '16px',
                                                color: 'blue',
                                                boxShadow: '3px 3px 1px gray',
                                                paddingLeft: '10px',
                                                marginBottom: '20px',
                                                width: '400px',
                                                textAlign: 'center',
                                            }}
                                        />
                                        {/* <label>
                                            <FontAwesomeIcon
                                                icon={faPaperPlane}
                                                size="lg"
                                                style={{
                                                    outline: 'none',
                                                    borderRadius: '50%',
                                                    border: '1.5px solid #221718',
                                                    boxShadow: '3px 3px 1px gray',
                                                    borderColor: 'black',
                                                    backgroundColor: 'white',
                                                    color: 'black',
                                                }}
                                            />
                                        </label> */}
                                    </form>{' '}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        outline: 'none',
                                        borderRadius: '10px',
                                        border: '1.5px solid #221718',
                                        fontSize: '16px',
                                        boxShadow: '3px 3px 1px gray',
                                        paddingLeft: '10px',
                                        marginBottom: '20px',
                                        textAlign: 'center',
                                    }}
                                >
                                    {cardAlbum.comment}
                                </div>
                            )}
                        </div>
                        <div>{dayjs(cardAlbum.createdAt).tz('utc').format('YYYY.MM.DD HH:mm:ss')}</div>
                    </AlbumSingle>
                </StyleContent>
            </div>
            <span>
                <hr style={{ marginTop: '-1px' }} />
            </span>
            <Footer />
        </>
    );
};
export default AlbumSinglePage;
