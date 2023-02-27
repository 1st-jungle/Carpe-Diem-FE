import axios from 'axios';
import { useSelector } from 'react-redux';
import { all, call, put, takeEvery, fork } from 'redux-saga/effects';
import config from '../../config';
import {
    CARD_LIST_LOADING_REQUEST,
    CARD_LIST_LOADING_SUCCESS,
    CARD_LIST_LOADING_FAILURE,
    CARD_LOADING_REQUEST,
    CARD_LOADING_SUCCESS,
    CARD_LOADING_FAILURE,
    CARD_UPDATE_REQUEST,
    CARD_UPDATE_SUCCESS,
    CARD_UPDATE_FAILURE,
    CARD_DELETE_REQUEST,
    CARD_DELETE_SUCCESS,
    CARD_DELETE_FAILURE,
} from '../types';

/* 카드 리스트 로드 */
const cardListLoadAPI: any = (data: any) => {
    return axios({
        method: 'get',
        url: `http://${config.server.host}:${config.server.port}/card`,
        withCredentials: true,
    });
};

function* cardListload(): any {
    try {
        const result = yield call(cardListLoadAPI);
        yield put({
            type: CARD_LIST_LOADING_SUCCESS,
            payload: result.data,
        });
    } catch (e: any) {
        yield put({
            type: CARD_LIST_LOADING_FAILURE,
            payload: e.response,
        });
    }
}

function* watchCardListLoad() {
    yield takeEvery(CARD_LIST_LOADING_REQUEST, cardListload);
}

/* 카드 정보 로드 */
const cardLoadAPI: any = (data: any) => {
    return axios({
        method: 'get',
        url: `http://${config.server.host}:${config.server.port}/card/${data}`,
        withCredentials: true,
    });
};

function* cardLoad(action: any): any {
    try {
        const result = yield call(cardLoadAPI, action.payload);
        yield put({
            type: CARD_LOADING_SUCCESS,
            payload: result.data,
        });
    } catch (e: any) {
        yield put({
            type: CARD_LOADING_FAILURE,
            payload: e.response,
        });
    }
}

function* watchCardLoad() {
    yield takeEvery(CARD_LOADING_REQUEST, cardLoad);
}

/* 카드 수정 */
const cardUpdateAPI = (data: any) => {
    return axios({
        method: 'put',
        url: `http://${config.server.host}:${config.server.port}/card/${data.card_id}`,
        withCredentials: true,
        data: data,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

function* cardUpdate(action: any): any {
    try {
        const result = yield call(cardUpdateAPI, action.payload);

        yield put({
            type: CARD_UPDATE_SUCCESS,
            payload: result.data,
        });
    } catch (e) {
        yield put({
            type: CARD_UPDATE_FAILURE,
            payload: e,
        });
    }
}

function* watchCardUpdate() {
    yield takeEvery(CARD_UPDATE_REQUEST, cardUpdate);
}

/* 카드 삭제 */
const cardDeleteAPI = (data: any) => {
    return axios({
        method: 'delete',
        url: `http://${config.server.host}:${config.server.port}/card/${data.card_id}`,
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

function* cardDelete(action: any): any {
    try {
        const result = yield call(cardDeleteAPI, action.payload);
        yield put({
            type: CARD_DELETE_SUCCESS,
            payload: result.data,
        });
    } catch (e) {
        yield put({
            type: CARD_DELETE_FAILURE,
            payload: e,
        });
    }
}

function* watchCardDelete() {
    yield takeEvery(CARD_DELETE_REQUEST, cardDelete);
}

function* cardListSaga() {
    yield all([fork(watchCardListLoad)]);
}

function* cardSaga() {
    yield all([fork(watchCardLoad), fork(watchCardUpdate), fork(watchCardDelete)]);
}

export { cardListSaga, cardSaga };
