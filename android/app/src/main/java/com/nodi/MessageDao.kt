package com.nodi

// Add android room and SQL Schema
import androidx.room.*
import com.nodi.Message

// Data Access Object — defines all SQL operations on the messages table
// Room generates the actual implementation at compile time
@Dao
interface MessageDao {
    // Inserts a new notification record into the database
    @Insert
    fun insert(message: Message)

    // Queries all recent notifications
    @Query("SELECT * FROM messages ORDER BY time DESC")
    fun getAll(): List<Message>

    // Returns only notifications the LLM decided to suppress
    // Used to populate the suppressed notifications log in the UI
    @Query("SELECT * FROM messages WHERE status = 'suppressed' ORDER BY time DESC")
    fun getSuppressed(): List<Message>
}