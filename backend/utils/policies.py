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
        # Admin bypass: Admins can see everything regardless of library filter
        if user.role == UserRole.ADMIN:
            return {}

        # Standard User Logic
        if library == ExerciseLibrary.PERSONAL:
            return {"user_id": user.id}
        if library == ExerciseLibrary.OFFICIAL:
            return {"is_official": True}
        
        # Default: Personal + Official
        return {"$or": [{"user_id": user.id}, {"is_official": True}]}

    @staticmethod
    def can_modify(user: User, exercise: Exercise) -> bool:
        """
        Determines if the user can update the exercise details.
        """

        if exercise.is_official and user.role == UserRole.ADMIN:
            return True
        return user.role == UserRole.ADMIN or exercise.user_id == user.id

    @staticmethod
    def can_delete(user: User, exercise: Exercise) -> bool:
        """
        Determines if a user can permanently remove an exercise.
        """

        if exercise.is_official and user.role == UserRole.ADMIN:
            return True
        return user.role == UserRole.ADMIN or exercise.user_id == user.id

    # @staticmethod
    # def can_verify(user: User) -> bool:
    #     """
    #     Only admins can promote a user-created exercise to "Official" status.
    #     """

    #     return user.role == UserRole.ADMIN


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


class SessionPolicy:
    pass


class UserPolicy:
    pass
