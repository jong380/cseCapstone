package com.nodi

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.nodi.Message


// Nodi database object
@Database(entities = [Message::class], version = 1, exportSchema = false)
abstract class NodiDatabase : RoomDatabase() {

    // Exposes the DAO so callers can run queries without touching SQL directly
    abstract fun messageDao(): MessageDao

    companion object {
        @Volatile private var INSTANCE: NodiDatabase? = null

        // Initializes the Nodi DB Object
        fun getInstance(context: Context): NodiDatabase {
            return INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(
                    context.applicationContext,
                    NodiDatabase::class.java,
                    "nodi.db"
                ).build().also { INSTANCE = it }
            }
        }
    }
}