import { useCallback, useEffect, useReducer } from 'react';
import { getLogger } from '../core';
import { TripProps } from './TripProps';
import { getTrips } from './tripApi';

const log = getLogger('useTrips');

export interface TripsState {
  trips?: TripProps[],
  fetching: boolean,
  fetchingError?: Error,
}

export interface TripsProps extends TripsState {
  addTrip: () => void,
}

interface ActionProps {
  type: string,
  payload?: any,
}

const initialState: TripsState = {
  trips: undefined,
  fetching: false,
  fetchingError: undefined,
};

const FETCH_TRIPS_STARTED = 'FETCH_TRIPS_STARTED';
const FETCH_TRIPS_SUCCEEDED = 'FETCH_TRIPS_SUCCEEDED';
const FETCH_TRIPS_FAILED = 'FETCH_TRIPS_FAILED';

const reducer: (state: TripsState, action: ActionProps) => TripsState =
  (state, { type, payload }) => {
    switch(type) {
      case FETCH_TRIPS_STARTED:
        return { ...state, fetching: true };
      case FETCH_TRIPS_SUCCEEDED:
        return { ...state, trips: payload.trips, fetching: false };
      case FETCH_TRIPS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      default:
        return state;
    }
  };

export const useTrips: () => TripsProps = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { trips, fetching, fetchingError } = state;
  const addTrip = useCallback(() => {
    log('addTrip - TODO');
  }, []);
  useEffect(getTripsEffect, [dispatch]);
  log(`returns - fetching = ${fetching}, trips = ${JSON.stringify(trips)}`);
  return {
    trips,
    fetching,
    fetchingError,
    addTrip,
  };

  function getTripsEffect() {
    let canceled = false;
    fetchTrips();
    return () => {
      canceled = true;
    }

    async function fetchTrips() {
      try {
        log('fetchTrips started');
        dispatch({ type: FETCH_TRIPS_STARTED });
        const trips = await getTrips();
        log('fetchTrips succeeded');
        if (!canceled) {
          dispatch({ type: FETCH_TRIPS_SUCCEEDED, payload: { trips } });
        }
      } catch (error) {
        log('fetchTrips failed');
        if (!canceled) {
          dispatch({ type: FETCH_TRIPS_FAILED, payload: { error } });
        }
      }
    }
  }
};
