import * as types from '.';
import { currentCall } from '../store/calls';
import { assignmentById } from '../store/assignments';


export function retrieveSurveys() {
    return ({ dispatch, getState, z }) => {
        let call = currentCall(getState());
        let assignment = assignmentById(getState(), call.get('assignment_id'));
        let orgId = assignment.get('organization_id');

        dispatch({
            type: types.RETRIEVE_SURVEYS,
            meta: { orgId },
            payload: {
                promise: z.resource('orgs', orgId, 'surveys').get()
            }
        });
    };
}

export function retrieveSurvey(orgId, surveyId) {
    return ({ dispatch, z }) => {
        dispatch({
            type: types.RETRIEVE_SURVEY,
            meta: { orgId, surveyId },
            payload: {
                promise: z.resource('orgs', orgId,
                    'surveys', surveyId).get()
            }
        });
    };
}

export function storeSurveyResponse(surveyId, elemId, response) {
    return ({ dispatch, getState }) => {
        let call = currentCall(getState());
        let callId = call.get('id');

        dispatch({
            type: types.STORE_SURVEY_RESPONSE,
            meta: { callId, surveyId, elemId },
            payload: response,
        });
    };
}
