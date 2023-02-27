import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import { Box } from '@mui/system';
import { Typography, Button } from '@mui/material';
import axios from 'axios';
import config from '../../config';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

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

const VideoDelete = (props: any) => {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const onClickDelete = () => {
        axios({
            method: 'delete',
            url: `http://${config.server.host}:${config.server.port}/card/${props.cardId}`,
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
            <IconButton type="button" onClick={handleOpen}>
                <DeleteIcon sx={{ color: 'white' }} />
            </IconButton>
            <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
                <Box sx={style}>
                    <Typography color="#333" id="modal-modal-title" variant="h6" component="h2">
                        정말 삭제하시겠습니까?
                    </Typography>
                    <Typography fontSize={13} color="#64748b" id="modal-modal-description" sx={{ mt: 2, mb: 2 }}>
                        삭제된 앨범의 영상은 Video 탭에서 계속 볼 수 있습니다.
                    </Typography>
                    <Typography align="right">
                        <Button onClick={onClickDelete}>확인</Button>
                        <Button onClick={handleClose}>취소</Button>
                    </Typography>
                </Box>
            </Modal>
        </>
    );
};

export default VideoDelete;
