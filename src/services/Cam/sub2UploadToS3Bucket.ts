import axios from 'axios';
import config from '../../config';

export default (recordedChunks: any[]) => {
    const file = new File(recordedChunks, `test2.webm`);

    const formData = new FormData();

    formData.append('file', file);

    axios({
        url: `http://${config.server.host}:${config.server.port}/camera/test`,
        method: 'post',
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
        .then(function (result) {
            console.log(result.data[0]);
            console.log('파일 전송 성공');
        })
        .catch(function (error) {
            console.log(error);
            console.log('파일 전송 실패');
        });
};
