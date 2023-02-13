import './index.css';
import React, { useRef, useState } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import constraints from '../../common/constraints'; // CHECK

import styled, { keyframes } from 'styled-components';
import { TbLoader } from 'react-icons/tb';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const Rotate = styled.div`
    display: inline-block;
    animation: ${rotate} 2s linear infinite;
    padding: 2rem 1rem;
    font-size: 1.2rem;
`;

const OnButton = styled.button`
    color: #8a1441;
    font-size: 1em;
    width: 80px;
    margin: 1em;
    padding: 0.25em 1em;
    border: 2px solid #8a1441;
    border-radius: 3px;
    font-family: GangwonEduPowerExtraBoldA;
    &:active,
    &:hover,
    &:focus {
        background: var(--button-hover-bg-color, white);
    }
`;
const OffButton = styled.button`
    color: #2679cc;
    font-size: 1em;
    width: 80px;
    margin: 1em;
    padding: 0.25em 1em;
    border: 2px solid #2679cc;
    font-family: GangwonEduPowerExtraBoldA;
    border-radius: 3px;
    &:active,
    &:hover,
    &:focus {
        background: var(--button-hover-bg-color, white);
    }
`;

// 웹캠이 시작 중인지 확인
let camStart = false;

// 서버로 넘어가는 유저 아이디
const userId = 'HSH';

// 비디오 사이즈 설정
function WebCamPage() {
    const wrapRef = useRef<any>(null);
    const videoRef = useRef<any>(null);

    const [isStartDetect, setIsStartDetect] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // 라벨링 할 인물 이미지 로컬에서 가져오기
    const loadImage = async () => {
        // 업로드 된 이미지 이름을 배열에 담아 라벨링 합니다.
        const labels = [`${userId}`];

        return Promise.all(
            labels.map(async (label) => {
                const images = await faceapi.fetchImage(require(`./imgs/${label}.jpg`));
                const descriptions = [];
                const detections = await faceapi.detectSingleFace(images).withFaceLandmarks().withFaceDescriptor();
                if (detections) descriptions.push(detections.descriptor);

                return new faceapi.LabeledFaceDescriptors(label, descriptions);
            }),
        );
    };

    // 감정 인식 & 영상 다운로드
    const onPlay = async () => {
        // 이미지 정보를 기반으로 canvas 요소 생성
        const canvas = faceapi.createCanvasFromMedia(videoRef.current as HTMLVideoElement);
        if (wrapRef.current !== null) wrapRef.current.append(canvas);

        let displaySize = { width: constraints.video.width, height: constraints.video.height };
        // 영상 사이즈를 canvas에 맞추기 위한 설정
        if (videoRef.current) {
            displaySize = {
                width: videoRef.current.width,
                height: videoRef.current.height,
            };
        }

        // canvas 사이즈를 맞춤
        faceapi.matchDimensions(canvas, displaySize);

        // 로컬 대조 이미지 가져오기
        const labeledFaceDescriptors = await loadImage();

        // 안면 인식 부분
        const faceDetecting = async () => {
            let detections;
            if (videoRef.current) {
                detections = await faceapi
                    .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceExpressions()
                    .withAgeAndGender()
                    .withFaceDescriptors();
            }

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            // canvas 초기화
            canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

            const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.42);

            if (resizedDetections)
                resizedDetections.forEach((detection, i) => {
                    const matched = resizedDetections[i];
                    const box = matched.detection.box;
                    const showLabel = faceMatcher.findBestMatch(matched.descriptor).toString();
                    const distance = faceMatcher.findBestMatch(matched.descriptor).distance;
                    const label = faceMatcher.findBestMatch(matched.descriptor).label;
                    const drawBox = new faceapi.draw.DrawBox(box, { label: showLabel });
                    drawBox.draw(canvas);
                    // 기본 안면 인식 테두리, 겹치므로 제외
                    // faceapi.draw.drawDetections(canvas, resizedDetections);
                    // 감정 읽기
                    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
                });
        };

        const loop = () => {
            faceDetecting();
            setTimeout(loop, 1000.0);
        };
        setTimeout(loop, 1000.0);
    };

    // 모델에 따른 얼굴 감지 시작
    const startDetecting = async () => {
        // model load
        const loadModels = async () => {
            const MODEL_URL = '/models';

            Promise.all([
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                // video 에서 로드된 이미지 매칭 시 아래 모델이 필요 함.
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
            ]).then(() => {
                setModelsLoaded(true);
                if (camStart === false) {
                    camStart = true;
                    startVideo();
                }
            });
        };

        loadModels();
    };

    // 영상 권한 요청
    const startVideo = () => {
        setIsStartDetect(true);

        navigator.mediaDevices
            .getUserMedia(constraints)
            .then((stream) => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch((err) => console.error(err));

        console.log('영상 시작');
    };

    // 모델에 따른 얼굴 감지 중지
    const stopDetecting = async () => {
        if (camStart === true) {
            setModelsLoaded(false);
            camStart = false;

            setIsStartDetect(false);

            navigator.mediaDevices
                .getUserMedia(constraints)
                .then((stream) => {
                    if (videoRef.current) videoRef.current.srcObject = null;
                })
                .catch((err) => console.error(err));
        }

        console.log('영상 중지');
    };

    return (
        <div>
            <h2>Recording My DAY</h2>

            <div ref={wrapRef} id="wrap" style={{ borderStyle: 'none' }}>
                <div>
                    {camStart ? (
                        ''
                    ) : (
                        <Rotate>
                            <TbLoader size="50" style={{ padding: 0 }} />
                        </Rotate>
                    )}
                </div>
                <video ref={videoRef} autoPlay muted onPlay={onPlay} width={640} height={480} />
            </div>
            <div>
                <OnButton onClick={startDetecting}>ON</OnButton>
                <OffButton onClick={stopDetecting}>OFF</OffButton>
            </div>
        </div>
    );
}

export default WebCamPage;
