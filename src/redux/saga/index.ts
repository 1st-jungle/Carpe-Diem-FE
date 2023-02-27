import { all, fork } from 'redux-saga/effects';

import { authSaga, usimSaga } from './authSaga';
import { albumListSaga, albumSaga } from './albumSaga';
import { cardListSaga, cardSaga } from './cardSaga';

export default function* rootSaga() {
    yield all([fork(authSaga), fork(usimSaga), fork(albumListSaga), fork(albumSaga), fork(cardSaga), fork(cardListSaga)]);
}
