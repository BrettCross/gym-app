from backend.models.user import User, UserRole
from backend.models.exercise import Exercise
from backend.models.workout import Workout
from backend.models.session import Session
from backend.models.enums import ExerciseLibrary


class ExercisePolicy:
    """
    Authorization logic for the Exercise library.
    Ensures data integrity between Official and User-created content.
    """
    
    @staticmethod
    def can_view(user: User, exercise: Exercise) -> bool:
        """
        User can see the exercise if they own it, it's official, or they are an admin.
        """

        if exercise.is_official:
            return True
        
        return user.role == UserRole.ADMIN or exercise.user_id == user.id
    
    @staticmethod
    def get_read_filter(user: User, library: ExerciseLibrary | None) -> dict:
        """
        Returns a MongoDB filter based on user role and requested library.
        Encapsulates the 'Official vs Personal' visibility logic.
        """

        if user.role == UserRole.ADMIN:
            return {}

        if library == ExerciseLibrary.PERSONAL:
            return {"user_id": user.id}
        
        if library == ExerciseLibrary.OFFICIAL:
            return {"is_official": True}
        
        # Default: Personal + Official
        return {"$or": [{"user_id": user.id}, {"is_official": True}]}

    @staticmethod
    def can_modify(user: User, exercise: Exercise) -> bool:
        """
        User can modify the exercise details if they are an admin or they own it. 
        Only an admin can modify an official exercise.
        """

        if exercise.is_official and user.role == UserRole.ADMIN:
            return True
        
        return user.role == UserRole.ADMIN or exercise.user_id == user.id

    @staticmethod
    def can_delete(user: User, exercise: Exercise) -> bool:
        """
        User can delete the exercise if they are an admin or they own it. 
        Only an admin can delete an official exercise.
        """

        if exercise.is_official and user.role == UserRole.ADMIN:
            return True
        
        return user.role == UserRole.ADMIN or exercise.user_id == user.id


class WorkoutPolicy:
    """
    Authorization logic for the Workout resource.
    Ensures data integrity of User-created content.
    """

    @staticmethod
    def can_view(user: User, workout: Workout) -> bool:
        """
        User can see workout if they own it or they are an admin. 
        """

        return user.role == UserRole.ADMIN or workout.user_id == user.id

    @staticmethod
    def get_read_filter(user: User) -> dict:
        """
        Returns a MongoDB filter for workouts.

        Admins receive an empty filter (all access).
        Users are restricted to their own ID.
        """

        if user.role == UserRole.ADMIN:
            return {}
        
        return {"user_id": user.id}

    @staticmethod
    def can_modify(user: User, workout: Workout) -> bool:
        """
        User can modify the workout if they own it.
        """

        return workout.user_id == user.id
    
    @staticmethod
    def can_delete(user: User, workout: Workout) -> bool:
        """
        User can delete the workout if they own it or they are an admin.
        """

        return user.role == UserRole.ADMIN or workout.user_id == user.id


class SessionPolicy:
    """
    Authorization logic for the Session resource
    Ensures data integrity of User-created content.
    """

    @staticmethod
    def can_view(user: User, session: Session) -> bool:
        """
        User can see workout if they own it or they are an admin. 
        """

        return user.role == UserRole.ADMIN or session.user_id == user.id

    @staticmethod
    def get_read_filter(user: User) -> dict:
        """
        Returns a MongoDB filter for sessions.

        Admins receive an empty filter (all access).
        Users are restricted to their own ID.
        """

        if user.role == UserRole.ADMIN:
            return {}
        
        return {"user_id": user.id}

    @staticmethod
    def can_modify(user: User, session: Session) -> bool:
        """
        User can modify the session if they own it.
        """

        return session.user_id == user.id

    @staticmethod
    def can_delete(user: User, session: Session) -> bool:
        """
        User can delete the session if they own it or they are an admin.
        """
        
        return user.role == UserRole.ADMIN or session.user_id == user.id


class UserPolicy:
    pass
