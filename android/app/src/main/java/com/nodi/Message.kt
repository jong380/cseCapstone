package com.nodi

// We added entity class to represent the database table
import androidx.room.Entity
import androidx.room.PrimaryKey

// Represents a single notification entry in the local Room database
// Each field maps to a column in the "messages" table
@Entity(tableName = "messages")
data class Message(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val notifKey: String,
    val time: String,
    val content: String,
    val source: String,
    val sender: String,
    val status: String
)