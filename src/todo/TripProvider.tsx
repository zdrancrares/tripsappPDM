// TripProvider.tsx

import React, { useCallback, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { TripProps } from './TripProps';
import { createTrip, getTrips, newWebSocket, updateTrip } from './tripApi';

const log = getLogger('TripProvider');

type SaveTripFn = (trip: TripProps) => Promise<any>;
type GetTripByIdFn = (id: string) => TripProps | undefined;

export interface TripsState {
  trips?: TripProps[];
  fetching: boolean;
  fetchingError?: Error | null;
  saving: boolean;
  savingError?: Error | null;
  saveTrip?: SaveTripFn;
  getTripById?: GetTripByIdFn;
}

interface ActionProps {
  type: string;
  payload?: any;
}

const initialState: TripsState = {
  fetching: false,
  saving: false,
};

const FETCH_TRIPS_STARTED = 'FETCH_TRIPS_STARTED';
const FETCH_TRIPS_SUCCEEDED = 'FETCH_TRIPS_SUCCEEDED';
const FETCH_TRIPS_FAILED = 'FETCH_TRIPS_FAILED';
const SAVE_TRIP_STARTED = 'SAVE_TRIP_STARTED';
const SAVE_TRIP_SUCCEEDED = 'SAVE_TRIP_SUCCEEDED';
const SAVE_TRIP_FAILED = 'SAVE_TRIP_FAILED';
const DELETE_TRIP = 'DELETE_TRIP';

const reducer: (state: TripsState, action: ActionProps) => TripsState =
    (state, { type, payload }) => {
      switch (type) {
        case FETCH_TRIPS_STARTED:
          return { ...state, fetching: true, fetchingError: null };
        case FETCH_TRIPS_SUCCEEDED:
          return { ...state, trips: payload.trips, fetching: false };
        case FETCH_TRIPS_FAILED:
          return { ...state, fetchingError: payload.error, fetching: false };
        case SAVE_TRIP_STARTED:
          return { ...state, savingError: null, saving: true };
        case SAVE_TRIP_SUCCEEDED:
          const trips = [...(state.trips || [])];
          const trip = payload.trip;
          const index = trips.findIndex(t => t.id === trip.id);
          if (index === -1) {
            trips.splice(0, 0, trip);
          } else {
            trips[index] = trip;
          }
          return { ...state, trips, saving: false };
        case SAVE_TRIP_FAILED:
          return { ...state, savingError: payload.error, saving: false };
        case DELETE_TRIP:
          return {
            ...state,
            trips: state.trips?.filter(t => t.id !== payload.id),
          };
        default:
          return state;
      }
    };

export const TripContext = React.createContext<TripsState>(initialState);

interface TripProviderProps {
  children: PropTypes.ReactNodeLike;
}

export const TripProvider: React.FC<TripProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { trips, fetching, fetchingError, saving, savingError } = state;

  useEffect(getTripsEffect, []);
  useEffect(wsEffect, []);

  const saveTrip = useCallback<SaveTripFn>(saveTripCallback, [dispatch]);

  const getTripById = useCallback<GetTripByIdFn>(
      (id: string) => {
        return trips?.find(trip => trip.id === id);
      },
      [trips]
  );

  const value: TripsState = {
    trips,
    fetching,
    fetchingError,
    saving,
    savingError,
    saveTrip,
    getTripById,
  };

  log('returns');
  return (
      <TripContext.Provider value={value}>
        {children}
      </TripContext.Provider>
  );

  function getTripsEffect() {
    let canceled = false;
    fetchTrips();
    return () => {
      canceled = true;
    };

    async function fetchTrips() {
      try {
        log('fetchTrips started');
        dispatch({ type: FETCH_TRIPS_STARTED });
        const fetchedTrips = await getTrips();

        const tripsWithDates: TripProps[] = fetchedTrips.map(trip => ({
          ...trip,
          date: trip.date ? new Date(trip.date) : null,
        }));

        log('fetchTrips succeeded');
        if (!canceled) {
          dispatch({ type: FETCH_TRIPS_SUCCEEDED, payload: { trips: tripsWithDates } });
        }
      } catch (error) {
        log('fetchTrips failed', error);
        if (!canceled) {
          dispatch({ type: FETCH_TRIPS_FAILED, payload: { error } });
        }
      }
    }
  }

  async function saveTripCallback(trip: TripProps): Promise<void> {
    try {
      log('saveTrip started');
      dispatch({ type: SAVE_TRIP_STARTED });

      const savedTrip = await (trip.id ? updateTrip(trip) : createTrip(trip));

      const trip2 = Array.isArray(savedTrip) ? savedTrip[0] : savedTrip;

      if (trip2) {
        const tripWithDate: TripProps = {
          ...trip2,
          date: trip2.date ? new Date(trip2.date) : null,
          withCar: trip2.withCar ?? false,      
          budget: trip2.budget ?? 0,            
          destination: trip2.destination ?? 'Unknown',
        };
        log('saveTrip succeeded');
        dispatch({ type: SAVE_TRIP_SUCCEEDED, payload: { trip: tripWithDate } });
      } else {
        console.error('Trip is not found');
      }

    } catch (error) {
      log('saveTrip failed', error);
      dispatch({ type: SAVE_TRIP_FAILED, payload: { error: error instanceof Error ? error.message : 'Unknown error' } });
    }
  }
  
  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    const closeWebSocket = newWebSocket(message => {
      if (canceled) {
        return;
      }
      const { event, payload: { trip } } = message;
      log(`ws message, trip ${event}`);
      
      const tripWithDate: TripProps = {
        ...trip,
        date: trip.date ? new Date(trip.date) : null,
      };

      if (event === 'created' || event === 'updated') {
        dispatch({ type: SAVE_TRIP_SUCCEEDED, payload: { trip: tripWithDate } });
      } else if (event === 'deleted') {
        dispatch({
          type: DELETE_TRIP,
          payload: { id: tripWithDate.id },
        });
      }
    });

    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket();
    };
  }
};
