import axios from 'axios';
import config from '../../config';

export default (recordInfo: any, recordedChunks: any[]) => {
    console.log('ssssssssssssss', new Date());
    // 녹화 영상 저장 이름 조합
    const startTime = new Date(recordInfo.startTime).toString().split(' ')[4];
    const recordSave = startTime.split(':').join('_');

    const file = new File(recordedChunks, `${recordSave}.webm`);

    const expressionData = {
        expressionLabel: recordInfo.label,
        expressionValue: recordInfo.maxValue,
        expressionTime: recordInfo.maxTime,
    };

    const formData = new FormData();

    formData.append('file', file);
    formData.append('expressionData', JSON.stringify(expressionData));

    // axios({
    //     url: `/camera`,
    //     method: 'post',
    //     withCredentials: true,
    //     data: formData,
    //     headers: {
    //         'Content-Type': 'multipart/form-data',
    //     },
    // })
    //     .then(function (result) {
    //         console.log(result.data[0]);
    //         console.log('파일 전송 성공');
    //     })
    //     .catch(function (error) {
    //         console.log(error);
    //         console.log('파일 전송 실패');
    //     });

    axios({
        url: `/camera/ffmpeg`,
        method: 'post',
        withCredentials: true,
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
        .then(function (result) {
            console.log(result.data[0]);
            console.log('파일 전송, 썸네일 생성 성공');
        })
        .catch(function (error) {
            console.log(error);
            console.log('파일 전송, 썸네일 생성 실패');
        });
};
